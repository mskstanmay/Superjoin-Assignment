-- Run by Node's transactional, checksummed migration runner.
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  original_filename TEXT NOT NULL,
  sha256 TEXT NOT NULL UNIQUE CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  storage_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type = 'application/pdf'),
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  page_count INTEGER CHECK (page_count > 0),
  metadata JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(metadata) = 'object'),
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','queued','processing','retry_wait','completed','partially_completed','failed')),
  active_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE processing_runs (
  id UUID PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES documents(id),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','retry_wait','completed','partially_completed','failed')),
  stage TEXT CHECK (stage IN ('document_understanding','extraction','normalization','matching','reasoning')),
  attempt INTEGER NOT NULL DEFAULT 0 CHECK (attempt >= 0),
  heartbeat_at TIMESTAMPTZ,
  next_attempt_at TIMESTAMPTZ,
  lease_token UUID,
  pipeline_version TEXT NOT NULL,
  schema_version TEXT NOT NULL,
  conversion_version TEXT NOT NULL,
  chunk_policy_version TEXT NOT NULL,
  normalization_version TEXT NOT NULL,
  model_version TEXT,
  prompt_version TEXT,
  facts_published_at TIMESTAMPTZ,
  checkpoint JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(checkpoint) = 'object'),
  usage JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(usage) = 'object'),
  diagnostics JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(diagnostics) = 'object'),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (id, document_id),
  CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);
ALTER TABLE documents ADD CONSTRAINT active_run_ownership
  FOREIGN KEY (active_run_id, id) REFERENCES processing_runs(id, document_id);
CREATE UNIQUE INDEX one_open_run_per_document ON processing_runs(document_id)
  WHERE status IN ('queued','processing','retry_wait');
CREATE INDEX runs_eligible ON processing_runs(status, next_attempt_at, created_at);
CREATE INDEX runs_document ON processing_runs(document_id, created_at);
CREATE INDEX runs_heartbeat ON processing_runs(heartbeat_at) WHERE status = 'processing';
CREATE INDEX documents_created ON documents(created_at, id);

CREATE TABLE document_blocks (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL,
  document_id UUID NOT NULL,
  local_ref TEXT NOT NULL,
  label TEXT NOT NULL,
  original_text TEXT NOT NULL,
  structure JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(structure) = 'object'),
  parent_block_id UUID,
  section JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(section) = 'array'),
  reading_order INTEGER NOT NULL CHECK (reading_order >= 0),
  provenance JSONB NOT NULL CHECK (jsonb_typeof(provenance) = 'array' AND jsonb_array_length(provenance) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (run_id, document_id) REFERENCES processing_runs(id, document_id),
  UNIQUE (run_id, local_ref),
  UNIQUE (id, run_id),
  UNIQUE (id, run_id, document_id),
  FOREIGN KEY (parent_block_id, run_id) REFERENCES document_blocks(id, run_id)
);
CREATE INDEX blocks_order ON document_blocks(run_id, reading_order);
CREATE INDEX blocks_document ON document_blocks(document_id);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES processing_runs(id),
  chunk_index INTEGER NOT NULL CHECK (chunk_index >= 0),
  contextualized_text TEXT NOT NULL,
  token_count INTEGER NOT NULL CHECK (token_count >= 0),
  chunk_policy_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, chunk_index),
  UNIQUE (id, run_id)
);
-- Small membership table enforces ordering and same-run references in SQL.
CREATE TABLE document_chunk_blocks (
  chunk_id UUID NOT NULL,
  block_id UUID NOT NULL,
  run_id UUID NOT NULL,
  position INTEGER NOT NULL CHECK (position >= 0),
  PRIMARY KEY (chunk_id, position),
  UNIQUE (chunk_id, block_id),
  FOREIGN KEY (chunk_id, run_id) REFERENCES document_chunks(id, run_id),
  FOREIGN KEY (block_id, run_id) REFERENCES document_blocks(id, run_id)
);
CREATE INDEX chunk_blocks_block ON document_chunk_blocks(block_id);

CREATE TABLE entities (
  id UUID PRIMARY KEY,
  canonical_name TEXT NOT NULL,
  type_hint TEXT,
  resolution_rationale TEXT,
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
  interpretation_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE entity_aliases (
  id UUID PRIMARY KEY,
  entity_id UUID NOT NULL REFERENCES entities(id),
  original_mention TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  rationale TEXT NOT NULL,
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
  evidence_refs JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(evidence_refs) = 'array'),
  interpretation_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (entity_id, normalized_alias, interpretation_version)
);
CREATE INDEX entities_name ON entities(canonical_name);
CREATE INDEX entity_alias_lookup ON entity_aliases(normalized_alias);

CREATE TABLE predicates (
  id UUID PRIMARY KEY,
  canonical_label TEXT NOT NULL,
  interpretation_notes TEXT NOT NULL,
  interpretation_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE predicate_aliases (
  id UUID PRIMARY KEY,
  predicate_id UUID NOT NULL REFERENCES predicates(id),
  original_mention TEXT NOT NULL,
  normalized_alias TEXT NOT NULL,
  interpretation_notes TEXT NOT NULL,
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
  evidence_refs JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(evidence_refs) = 'array'),
  interpretation_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (predicate_id, normalized_alias, interpretation_version)
);
CREATE INDEX predicates_label ON predicates(canonical_label);
CREATE INDEX predicate_alias_lookup ON predicate_aliases(normalized_alias);

CREATE TABLE facts (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL,
  document_id UUID NOT NULL,
  candidate_key TEXT NOT NULL,
  assertion_text TEXT NOT NULL,
  subject_original TEXT NOT NULL,
  subject_entity_id UUID REFERENCES entities(id),
  predicate_original TEXT NOT NULL,
  predicate_id UUID REFERENCES predicates(id),
  value JSONB NOT NULL CHECK (jsonb_typeof(value) = 'object'),
  time JSONB NOT NULL CHECK (jsonb_typeof(time) = 'object'),
  qualifiers JSONB NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(qualifiers) = 'object'),
  polarity TEXT NOT NULL CHECK (polarity IN ('positive','negative','unknown')),
  modality TEXT NOT NULL CHECK (modality IN ('asserted','historical','estimate','forecast','target','conditional','unknown')),
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
  uncertainty JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(uncertainty) = 'array'),
  quality_state TEXT NOT NULL CHECK (quality_state IN ('accepted','review_needed','quarantined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (run_id, document_id) REFERENCES processing_runs(id, document_id),
  UNIQUE (run_id, candidate_key),
  UNIQUE (id, run_id, document_id)
);
CREATE INDEX facts_document ON facts(document_id, run_id);
CREATE INDEX facts_subject_predicate ON facts(subject_entity_id, predicate_id);
CREATE INDEX facts_predicate ON facts(predicate_id);
CREATE INDEX facts_quality ON facts(quality_state);

CREATE TABLE fact_evidence (
  id UUID PRIMARY KEY,
  fact_id UUID NOT NULL,
  block_id UUID NOT NULL,
  run_id UUID NOT NULL,
  document_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('assertion','value','subject','row_header','column_header','unit','time','footnote','qualifier')),
  selector JSONB NOT NULL CHECK (jsonb_typeof(selector) = 'object'),
  selector_key TEXT NOT NULL,
  quote TEXT NOT NULL CHECK (length(quote) > 0),
  provenance_selector JSONB NOT NULL CHECK (jsonb_typeof(provenance_selector) = 'array' AND jsonb_array_length(provenance_selector) > 0),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('pending','validated','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (fact_id, run_id, document_id) REFERENCES facts(id, run_id, document_id),
  FOREIGN KEY (block_id, run_id, document_id) REFERENCES document_blocks(id, run_id, document_id),
  UNIQUE (fact_id, block_id, role, selector_key)
);
CREATE INDEX evidence_block ON fact_evidence(block_id);

CREATE TABLE relationships (
  id UUID PRIMARY KEY,
  fact_a_id UUID NOT NULL REFERENCES facts(id),
  fact_b_id UUID NOT NULL REFERENCES facts(id),
  type TEXT NOT NULL CHECK (type IN ('CORROBORATED','CONTRADICTED','RECONCILED','UNCERTAIN')),
  explanation TEXT NOT NULL,
  dimension_comparison JSONB NOT NULL CHECK (jsonb_typeof(dimension_comparison) = 'array'),
  confidence NUMERIC CHECK (confidence BETWEEN 0 AND 1),
  confidence_source TEXT NOT NULL CHECK (confidence_source IN ('model','rule')),
  uncertainty JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(uncertainty) = 'array'),
  supporting_evidence_ids JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(supporting_evidence_ids) = 'array'),
  reasoning_run_id UUID NOT NULL REFERENCES processing_runs(id),
  reasoning_version TEXT NOT NULL,
  model_version TEXT,
  prompt_version TEXT,
  input_hash TEXT NOT NULL CHECK (input_hash ~ '^[a-f0-9]{64}$'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (fact_a_id < fact_b_id),
  UNIQUE (fact_a_id, fact_b_id, reasoning_version, input_hash)
);
CREATE INDEX relationships_b ON relationships(fact_b_id);
CREATE INDEX relationships_type ON relationships(type);
CREATE INDEX relationships_run ON relationships(reasoning_run_id);

CREATE TABLE processing_issues (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES processing_runs(id),
  stage TEXT NOT NULL CHECK (stage IN ('document_understanding','extraction','normalization','matching','reasoning')),
  code TEXT NOT NULL,
  affected_ids JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof(affected_ids) = 'array'),
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','error')),
  observed_problem TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  retryable BOOLEAN NOT NULL,
  resolution TEXT,
  artifact_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX issues_run_stage ON processing_issues(run_id, stage);
CREATE INDEX issues_unresolved ON processing_issues(run_id) WHERE resolution IS NULL;

-- Coherence is validated by the future ingestion service before marking publication.
-- This guard prevents switching to a run that has not been published at all.
CREATE FUNCTION require_published_active_run() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.active_run_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM processing_runs WHERE id = NEW.active_run_id
      AND document_id = NEW.id AND facts_published_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Active run must contain a published coherent fact set';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER document_active_run_guard BEFORE INSERT OR UPDATE OF active_run_id
  ON documents FOR EACH ROW EXECUTE FUNCTION require_published_active_run();

CREATE FUNCTION require_cross_document_pair() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE doc_a UUID; doc_b UUID; quality_a TEXT; quality_b TEXT;
BEGIN
  SELECT document_id, quality_state INTO doc_a, quality_a FROM facts WHERE id = NEW.fact_a_id;
  SELECT document_id, quality_state INTO doc_b, quality_b FROM facts WHERE id = NEW.fact_b_id;
  IF doc_a = doc_b OR quality_a <> 'accepted' OR quality_b <> 'accepted' THEN
    RAISE EXCEPTION 'Relationships require accepted cross-document facts';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER relationship_pair_guard BEFORE INSERT OR UPDATE ON relationships
  FOR EACH ROW EXECUTE FUNCTION require_cross_document_pair();
