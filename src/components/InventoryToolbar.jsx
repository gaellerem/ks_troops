export default function InventoryToolbar({
  activeInventory,
  inventories,
  onInventoryChange,
  onRename,
  onNewInventory,
  showInventoryForm,
  showRenameForm,
  newInventoryName,
  inventoryNameDraft,
  onNewInventoryNameChange,
  onInventoryNameDraftChange,
  onCreateInventory,
  onRenameInventory,
}) {
  return <>
    <section className="inventory-toolbar">
      <div>
        <p className="eyebrow">Troop inventories</p>
        <h2>Active inventory</h2>
      </div>
      <select value={activeInventory.id} onChange={onInventoryChange} aria-label="Select troop inventory">
        {inventories.map((inventory) => <option value={inventory.id} key={inventory.id}>{inventory.name}</option>)}
      </select>
      <button className="secondary-button" type="button" onClick={onRename}>Rename</button>
      <button className="secondary-button" type="button" onClick={onNewInventory}>+ New inventory</button>
    </section>

    {showInventoryForm && <form className="new-inventory-form" onSubmit={onCreateInventory}>
      <label>
        Inventory name
        <input type="text" value={newInventoryName} onChange={onNewInventoryNameChange} placeholder="e.g. Main account" autoFocus required />
      </label>
      <button className="add-button" type="submit">Create inventory</button>
    </form>}

    {showRenameForm && <form className="new-inventory-form" onSubmit={onRenameInventory}>
      <label>
        Inventory name
        <input type="text" value={inventoryNameDraft} onChange={onInventoryNameDraftChange} autoFocus required />
      </label>
      <button className="add-button" type="submit">Save name</button>
    </form>}
  </>
}
