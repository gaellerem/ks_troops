export default function InventorySummary({ units, totalUnits, totals, visibleLevels, onContextMenu }) {
  return <section className="summary-panel">
    <div className="summary-heading">
      <div>
        <p className="eyebrow">Overview</p>
        <h2>Available troops</h2>
      </div>
      <div className="overview-metrics"><span className="overview-total"><strong>{totalUnits.toLocaleString('en-US')}</strong> total troops</span><span className="entry-count">{units.length} entr{units.length === 1 ? 'y' : 'ies'}</span></div>
    </div>
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Type</th><th>Total</th>{visibleLevels.map((item) => <th key={item}>{item}</th>)}</tr>
        </thead>
        <tbody>
          {totals.map((row) => <tr key={row.id}>
            <td><span className={`unit-mark ${row.color}`}>{row.icon}</span><strong>{row.label}</strong></td>
            <td className="row-total">{row.total.toLocaleString('en-US')}</td>
            {visibleLevels.map((item) => <td key={item} className="has-value" onContextMenu={(event) => row.byLevel[item] > 0 && onContextMenu(event, row.id, item)}>{row.byLevel[item].toLocaleString('en-US')}</td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
  </section>
}
