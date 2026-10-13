export default function ContextMenu({ menu, onDelete }) {
  return <div className="context-menu" style={{ left: menu.x, top: menu.y }} onClick={(event) => event.stopPropagation()}>
    <button type="button" onClick={onDelete}>Delete {menu.level} entry</button>
  </div>
}
