export default function SavedDistributions({ distributions, inventoryName, onOpen, onDelete }) {
  return <section className="saved-distributions">
    <div className="summary-heading"><div><p className="eyebrow">Saved formations · {inventoryName}</p><h2>My formations</h2></div><span className="entry-count">{distributions.length} saved</span></div>
    <div className="saved-list">{distributions.map((distribution) => <div className="saved-item" key={distribution.id}><strong>{distribution.name}</strong><span>{distribution.marches.map((march) => march.name).join(', ')}</span><span>{distribution.marches.reduce((sum, march) => sum + Number(march.quantity), 0).toLocaleString('en-US')} units</span><span>{distribution.unusedTotal.toLocaleString('en-US')} unused ({distribution.unusedRatio}%)</span><span className="saved-actions"><button className="open-formation-button" type="button" onClick={() => onOpen(distribution)}>Open</button><button className="delete-formation-button" type="button" onClick={() => onDelete(distribution.id)}>Delete</button></span></div>)}</div>
  </section>
}
