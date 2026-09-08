import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getFact, listDocuments, listFacts, listRelationships, uploadPdf } from './api';
import './style.css';

type AnyRecord = Record<string, any>;

function App() {
  const [view, setView] = useState('documents');
  const [documents, setDocuments] = useState<AnyRecord[]>([]);
  const [facts, setFacts] = useState<AnyRecord[]>([]);
  const [relationships, setRelationships] = useState<AnyRecord[]>([]);
  const [selectedFact, setSelectedFact] = useState<AnyRecord>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function refresh() { try { const [docs, extracted, compared] = await Promise.all([listDocuments(), listFacts(), listRelationships()]); setDocuments(docs); setFacts(extracted); setRelationships(compared); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Request failed'); } }
  useEffect(() => { void refresh(); const timer = window.setInterval(() => void refresh(), 3000); return () => window.clearInterval(timer); }, []);
  async function chooseFile(event: React.ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; setBusy(true); setError(''); try { await uploadPdf(file); await refresh(); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Upload failed'); } finally { setBusy(false); event.target.value = ''; } }
  async function showFact(id: string) { try { setSelectedFact(await getFact(id)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Fact unavailable'); } }
  return <div className="shell">
    <header><div><p className="eyebrow">Superjoin / evidence workspace</p><h1>Compare what the PDFs actually say.</h1><p className="lede">Grounded extraction, visible provenance, and cautious cross-document comparisons.</p></div><label className="upload"><input type="file" accept="application/pdf" onChange={chooseFile} disabled={busy} />{busy ? 'Processing...' : 'Upload PDF'}</label></header>
    <nav>{[['documents','Documents'],['facts','Facts'],['relationships','Relationships']].map(([key, label]) => <button className={view === key ? 'active' : ''} onClick={() => setView(key)} key={key}>{label}<span>{key === 'documents' ? documents.length : key === 'facts' ? facts.length : relationships.length}</span></button>)}</nav>
    {error && <div className="error" role="alert">{error}</div>}
    <main>{view === 'documents' && <section><div className="section-head"><div><p className="eyebrow">Input corpus</p><h2>Documents</h2></div><span className="muted">Live status refreshes automatically</span></div><div className="list">{documents.length ? documents.map(document => <article className="row" key={document.id}><div><strong>{document.original_filename}</strong><p>{document.page_count ? `${document.page_count} pages` : 'Page count pending'} · {document.sha256.slice(0, 12)}...</p></div><span className={`status ${document.status}`}>{document.status}</span><div className="count">{document.processing?.counts?.facts_accepted ?? 0} facts</div></article>) : <div className="empty">Upload two PDFs to begin comparing grounded claims.</div>}</div></section>}
      {view === 'facts' && <section><div className="section-head"><div><p className="eyebrow">Source assertions</p><h2>Facts</h2></div></div><div className="table">{facts.length ? facts.map(fact => <button className="fact" key={fact.id} onClick={() => void showFact(fact.id)}><span><b>{fact.subject_original}</b><small>{fact.predicate_original}</small></span><span>{fact.value?.original_text} {fact.value?.unit}</span><span>{fact.time?.original_label || 'Time not specified'}</span><span>{fact.confidence == null ? 'n/a' : `${Math.round(fact.confidence * 100)}%`}</span></button>) : <div className="empty">No facts have been published yet.</div>}</div></section>}
      {view === 'relationships' && <section><div className="section-head"><div><p className="eyebrow">Cross-document review</p><h2>Relationships</h2></div></div><div className="relationships">{relationships.length ? relationships.map(relationship => <article className="relationship" key={relationship.id}><div className={`label ${relationship.type}`}>{relationship.type}</div><div className="pair"><div><b>{relationship.fact_a}</b><small>{relationship.document_a}</small></div><div className="arrow">→</div><div><b>{relationship.fact_b}</b><small>{relationship.document_b}</small></div></div><p>{relationship.explanation}</p></article>) : <div className="empty">Relationships appear after two documents share a candidate subject or predicate.</div>}</div></section>}</main>
    {selectedFact && <aside className="drawer"><button className="close" onClick={() => setSelectedFact(undefined)}>Close</button><p className="eyebrow">Fact evidence</p><h2>{selectedFact.subject_original}</h2><p className="assertion">{selectedFact.assertion_text}</p><dl><dt>Predicate</dt><dd>{selectedFact.predicate_original}</dd><dt>Normalized value</dt><dd>{selectedFact.value?.normalized ?? selectedFact.value?.original_text} {selectedFact.value?.unit}</dd></dl><h3>Actual source</h3>{(selectedFact.evidence || []).map((evidence: AnyRecord) => <blockquote key={evidence.id}><p>{evidence.quote}</p><cite>{selectedFact.original_filename} · PDF page {evidence.page || 'not reported'}</cite></blockquote>)}</aside>}
  </div>;
}
createRoot(document.getElementById('root')!).render(<App />);