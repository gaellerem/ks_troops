export default function InventoryEntryPanel({
  type,
  level,
  quantity,
  troopTypes,
  levels,
  onTypeChange,
  onLevelChange,
  onQuantityChange,
  onSubmit,
}) {
  return <aside className="entry-panel">
    <div className="panel-heading">
      <span className="step-number">01</span>
      <div>
        <p className="eyebrow">Inventory</p>
        <h2>Add troops</h2>
      </div>
    </div>
    <p className="panel-copy">Add each reserve by type and tier. Similar entries will be grouped automatically.</p>

    <form onSubmit={onSubmit}>
      <label>
        Unit type
        <select value={type} onChange={onTypeChange}>
          {troopTypes.map((troopType) => <option value={troopType.id} key={troopType.id}>{troopType.label}</option>)}
        </select>
      </label>
      <label>
        Tier
        <select value={level} onChange={onLevelChange}>
          {[...levels].reverse().map((item) => <option value={item} key={item}>{item}</option>)}
        </select>
      </label>
      <label>
        Unit count
        <input type="number" min="1" step="1" value={quantity} onChange={onQuantityChange} placeholder="e.g. 2500" required />
      </label>
      <button className="add-button" type="submit"><span>+</span> Add to table</button>
    </form>
  </aside>
}
