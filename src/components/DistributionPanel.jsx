export default function DistributionPanel({
  formationName,
  marchCount,
  marches,
  troopTypes,
  troopPriority,
  levels,
  totalUnits,
  unusedTotal,
  unusedRatio,
  unusedTroops,
  marchAllocations,
  getRatioTotal,
  onFormationNameChange,
  onTroopPriorityChange,
  onMarchCountChange,
  onMarchChange,
  onMarchModeChange,
  onMarchUnitChange,
  onFillMarch,
  onAdjustMarch,
  onSave,
  onClose,
}) {
  return <section className="distribution-panel">
    <div className="distribution-header">
      <div className="panel-heading">
        <span className="step-number">02</span>
        <div>
          <p className="eyebrow">Formation setup</p>
          <h2>New march distribution</h2>
        </div>
      </div>
      <button className="close-button" type="button" aria-label="Close distribution setup" onClick={onClose}>x</button>
    </div>
    <div className="march-controls">
      <label>
        Formation name
        <input type="text" value={formationName} onChange={onFormationNameChange} placeholder="e.g. Canyon assault" />
      </label>
      <label>
        Number of marches
        <input type="number" min="1" max="20" value={marchCount} onChange={onMarchCountChange} />
      </label>
      <p className="panel-copy">Define the troop count and composition ratio for each march. Ratios must add up to 100%.</p>
      <fieldset className="troop-priority-control">
        <legend>Troop type priority</legend>
        <ol>
          {troopPriority.map((troopTypeId, index) => {
            const troopType = troopTypes.find(({ id }) => id === troopTypeId)
            return <li key={troopTypeId}>
              <span>{index + 1}</span>
              <strong>{troopType.label}</strong>
              <div>
                <button type="button" aria-label={`Move ${troopType.label} priority up`} onClick={() => onTroopPriorityChange(troopTypeId, -1)} disabled={index === 0}>↑</button>
                <button type="button" aria-label={`Move ${troopType.label} priority down`} onClick={() => onTroopPriorityChange(troopTypeId, 1)} disabled={index === troopPriority.length - 1}>↓</button>
              </div>
            </li>
          })}
        </ol>
      </fieldset>
    </div>
    <div className="march-grid">
      {marches.map((march, marchIndex) => {
        const ratioTotal = getRatioTotal(march)
        const marchAllocation = marchAllocations.find((item) => item.marchId === march.id)
        const allocationByType = Object.fromEntries(marchAllocation.allocation.map((troopType) => [troopType.id, troopType]))
        return <article className="march-card" key={march.id}>
          <div className="march-card-header"><input className="march-name-input" type="text" value={march.name} onChange={(event) => onMarchChange(march.id, 'name', event.target.value)} aria-label={`Name for march ${march.id}`} /><span className={ratioTotal === 100 ? 'ratio-valid' : 'ratio-invalid'}>{ratioTotal}%</span></div>
          <label>Troop count<input type="number" min="1" step="1" value={march.quantity} onChange={(event) => onMarchChange(march.id, 'quantity', event.target.value)} placeholder="e.g. 10000" readOnly={march.inputMode === 'units'} /></label>
          {marchIndex === marches.length - 1 && Object.values(marchAllocation.availableByType).some((amount) => amount > 0) && <button className="fill-march-button" type="button" onClick={() => onFillMarch(marchAllocation)}>Fill with remaining troops</button>}
          <div className="composition-mode" role="group" aria-label={`Composition input for ${march.name}`}>
            <button type="button" aria-pressed={march.inputMode !== 'units'} onClick={() => onMarchModeChange(march.id, 'ratio')}>Ratios</button>
            <button type="button" aria-pressed={march.inputMode === 'units'} onClick={() => onMarchModeChange(march.id, 'units')}>Units</button>
          </div>
          <div className="ratio-fields">
            {troopTypes.map((troopType) => <label key={troopType.id}>{troopType.label}<div className="ratio-input"><input type="number" min="0" step="1" max={march.inputMode === 'units' ? undefined : 100} value={march.inputMode === 'units' ? (march.unitAllocation?.[troopType.id] ?? 0) : march[troopType.id]} onChange={(event) => march.inputMode === 'units' ? onMarchUnitChange(march.id, troopType.id, event.target.value) : onMarchChange(march.id, troopType.id, event.target.value)} />{march.inputMode !== 'units' && <span>%</span>}</div>{march.inputMode === 'units' && <span className="ratio-amount">{march[troopType.id]}%</span>}</label>)}
          </div>
          <div className="allocation-details">
            <div className="allocation-title">Allocated from inventory <span>{marchAllocation.allocatedTotal.toLocaleString('en-US')} / {marchAllocation.requestedTotal.toLocaleString('en-US')}</span></div>
            {troopTypes.map(({ id }) => allocationByType[id]).map((troopType) => <div className="allocation-row" key={troopType.id}>
              <span className={`allocation-mark ${troopType.color}`}>{troopType.icon}</span>
              <strong>{troopType.label}</strong>
              <span className={troopType.allocated < troopType.requested ? 'allocation-missing' : ''}>{troopType.allocated.toLocaleString('en-US')} units</span>
              <div className="tier-breakdown">{troopType.byTier.length > 0 ? troopType.byTier.map((tierItem) => <span key={tierItem.tier}>{tierItem.tier}: {tierItem.amount.toLocaleString('en-US')}</span>) : <span className="allocation-empty">No available units</span>}</div>
            </div>)}
            {ratioTotal === 100 && marchAllocation.allocatedTotal < marchAllocation.requestedTotal && <>
              <p className="allocation-warning">Not enough troops available to fill this march.</p>
              <button className="adjust-march-button" type="button" onClick={() => onAdjustMarch(marchAllocation)} disabled={marchAllocation.allocatedTotal === 0}>Adjust to available troops</button>
            </>}
          </div>
        </article>
      })}
    </div>
    <button className="save-distribution-button" type="button" onClick={onSave} disabled={marches.some((march) => getRatioTotal(march) !== 100 || !march.quantity)}>Save distribution</button>
    {totalUnits > 0 && <div className="setup-unused-panel">
      <div className="summary-heading">
        <div><p className="eyebrow">Remaining inventory</p><h2>Unused troops in this setup</h2></div>
        <div className="unused-total"><strong>{unusedTotal.toLocaleString('en-US')}</strong><span>{unusedRatio}% of total</span></div>
      </div>
      <div className="unused-grid">
        {unusedTroops.map((troopType) => <div className="unused-card" key={troopType.id}>
          <div className="unused-card-heading"><span className={`unit-mark ${troopType.color}`}>{troopType.icon}</span><strong>{troopType.label}</strong><span>{troopType.total.toLocaleString('en-US')} units</span></div>
          <div className="unused-tiers">{[...levels].reverse().filter((tier) => troopType.byLevel[tier] > 0).map((tier) => <span key={tier}>{tier}: {troopType.byLevel[tier].toLocaleString('en-US')}</span>)}{troopType.total === 0 && <span className="allocation-empty">None remaining</span>}</div>
        </div>)}
      </div>
    </div>}
  </section>
}
