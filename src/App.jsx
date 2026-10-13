import { useEffect, useMemo, useState } from 'react'
import './App.css'
import ContextMenu from './components/ContextMenu'
import DistributionPanel from './components/DistributionPanel'
import InventoryEntryPanel from './components/InventoryEntryPanel'
import InventorySummary from './components/InventorySummary'
import InventoryToolbar from './components/InventoryToolbar'
import SavedDistributions from './components/SavedDistributions'

const troopTypes = [
  { id: 'infantry', label: 'Infantry', icon: 'I', color: 'olive' },
  { id: 'cavalry', label: 'Cavalry', icon: 'C', color: 'rust' },
  { id: 'archery', label: 'Archers', icon: 'A', color: 'blue' },
]

const levels = Array.from({ length: 10 }, (_, index) => `T${index + 1}`)
const ratioPriority = ['archery', 'cavalry', 'infantry']
const savedFormationsStorageKey = 'troop-organizer-formations'
const inventoryStorageKey = 'troop-organizer-inventory'

function loadInventories() {
  try {
    const storedValue = JSON.parse(localStorage.getItem(inventoryStorageKey))
    if (Array.isArray(storedValue)) {
      return [{ id: 1, name: 'Inventory 1', units: storedValue }]
    }
    if (Array.isArray(storedValue?.inventories) && storedValue.inventories.length > 0) {
      return storedValue.inventories
    }
  } catch {
    return [{ id: 1, name: 'Inventory 1', units: [] }]
  }

  return [{ id: 1, name: 'Inventory 1', units: [] }]
}

function createMarches(count) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `March ${index + 1}`,
    quantity: '',
    inputMode: 'ratio',
    infantry: 20,
    cavalry: 30,
    archery: 50,
  }))
}

function getRoundedRatios(amounts, priority = ratioPriority) {
  const total = Object.values(amounts).reduce((sum, amount) => sum + (Number(amount) || 0), 0)
  if (total === 0) return Object.fromEntries(troopTypes.map(({ id }) => [id, 0]))

  const ratios = Object.fromEntries(troopTypes.map(({ id }) => [id, Math.floor((Number(amounts[id]) || 0) * 100 / total)]))
  let remaining = 100 - Object.values(ratios).reduce((sum, ratio) => sum + ratio, 0)
  const priorityIndex = Object.fromEntries(priority.map((id, index) => [id, index]))
  const byRemainder = [...troopTypes].sort((first, second) => {
    const firstRemainder = (Number(amounts[first.id]) || 0) * 100 / total - ratios[first.id]
    const secondRemainder = (Number(amounts[second.id]) || 0) * 100 / total - ratios[second.id]
    return secondRemainder - firstRemainder || priorityIndex[first.id] - priorityIndex[second.id]
  })

  byRemainder.forEach(({ id }) => {
    if (remaining > 0) {
      ratios[id] += 1
      remaining -= 1
    }
  })
  return ratios
}

function createInventoryMarch(units) {
  const amounts = Object.fromEntries(troopTypes.map((troopType) => [
    troopType.id,
    units.filter((unit) => unit.type === troopType.id).reduce((sum, unit) => sum + unit.quantity, 0),
  ]))
  const total = Object.values(amounts).reduce((sum, amount) => sum + amount, 0)
  const ratios = Object.fromEntries(troopTypes.map((troopType) => [
    troopType.id,
    total > 0 ? Math.floor(amounts[troopType.id] * 100 / total) : 0,
  ]))
  let remainingPercentage = 100 - Object.values(ratios).reduce((sum, ratio) => sum + ratio, 0)
  ratioPriority.forEach((troopTypeId) => {
    if (remainingPercentage > 0 && amounts[troopTypeId] > 0) {
      ratios[troopTypeId] += 1
      remainingPercentage -= 1
    }
  })

  return {
    ...createMarches(1)[0],
    quantity: total > 0 ? String(total) : '',
    inputMode: 'units',
    unitAllocation: amounts,
    ...ratios,
  }
}

function createDistributionId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function normalizeTroopPriority(priority) {
  return [...new Set([...(Array.isArray(priority) ? priority : []), ...ratioPriority])]
    .filter((id) => troopTypes.some((troopType) => troopType.id === id))
    .slice(0, troopTypes.length)
}

function App() {
  const [type, setType] = useState('infantry')
  const [level, setLevel] = useState('T1')
  const [quantity, setQuantity] = useState('')
  const [inventories, setInventories] = useState(loadInventories)
  const [activeInventoryId, setActiveInventoryId] = useState(() => loadInventories()[0].id)
  const [showInventoryForm, setShowInventoryForm] = useState(false)
  const [newInventoryName, setNewInventoryName] = useState('')
  const [showRenameForm, setShowRenameForm] = useState(false)
  const [inventoryNameDraft, setInventoryNameDraft] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
  const [showDistribution, setShowDistribution] = useState(false)
  const [marchCount, setMarchCount] = useState(1)
  const [marches, setMarches] = useState(() => createMarches(1))
  const [troopPriority, setTroopPriority] = useState(ratioPriority)
  const [formationName, setFormationName] = useState('Formation 1')
  const [editingDistributionId, setEditingDistributionId] = useState(null)
  const [savedDistributions, setSavedDistributions] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(savedFormationsStorageKey)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(savedFormationsStorageKey, JSON.stringify(savedDistributions))
  }, [savedDistributions])

  useEffect(() => {
    localStorage.setItem(inventoryStorageKey, JSON.stringify({ inventories }))
  }, [inventories])

  const activeInventory = inventories.find((inventory) => inventory.id === activeInventoryId) || inventories[0]
  const units = activeInventory.units

  function updateUnits(updater) {
    setInventories((currentInventories) => currentInventories.map((inventory) => {
      if (inventory.id !== activeInventory.id) return inventory
      const nextUnits = typeof updater === 'function' ? updater(inventory.units) : updater
      return { ...inventory, units: nextUnits }
    }))
  }

  useEffect(() => {
    function closeContextMenu() {
      setContextMenu(null)
    }

    window.addEventListener('click', closeContextMenu)
    window.addEventListener('scroll', closeContextMenu, true)
    return () => {
      window.removeEventListener('click', closeContextMenu)
      window.removeEventListener('scroll', closeContextMenu, true)
    }
  }, [])

  const totals = useMemo(
    () =>
      troopTypes.map((troopType) => {
        const byLevel = Object.fromEntries(levels.map((item) => [item, 0]))
        units
          .filter((unit) => unit.type === troopType.id)
          .forEach((unit) => {
            byLevel[unit.level] += unit.quantity
          })

        return {
          ...troopType,
          byLevel,
          total: Object.values(byLevel).reduce((sum, value) => sum + value, 0),
        }
      }),
    [units],
  )

  const totalUnits = units.reduce((sum, unit) => sum + unit.quantity, 0)
  const visibleLevels = [...levels].reverse().filter((item) =>
    totals.some((row) => row.byLevel[item] > 0),
  )

  function addUnits(event) {
    event.preventDefault()
    const parsedQuantity = Number(quantity)
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) return

    updateUnits((currentUnits) => {
      const existingUnit = currentUnits.some((unit) => unit.type === type && unit.level === level)
      if (!existingUnit) return [...currentUnits, { type, level, quantity: parsedQuantity }]

      return currentUnits.map((unit) =>
        unit.type === type && unit.level === level ? { ...unit, quantity: parsedQuantity } : unit,
      )
    })
    setQuantity('')
  }

  function openContextMenu(event, unitType, unitLevel) {
    event.preventDefault()
    setContextMenu({ x: event.clientX, y: event.clientY, type: unitType, level: unitLevel })
  }

  function deleteUnits() {
    updateUnits((currentUnits) => currentUnits.filter(
      (unit) => unit.type !== contextMenu.type || unit.level !== contextMenu.level,
    ))
    setContextMenu(null)
  }

  function createInventory(event) {
    event.preventDefault()
    const name = newInventoryName.trim()
    if (!name) return

    const nextId = Math.max(...inventories.map((inventory) => inventory.id), 0) + 1
    setInventories((currentInventories) => [...currentInventories, { id: nextId, name, units: [] }])
    setActiveInventoryId(nextId)
    setNewInventoryName('')
    setShowInventoryForm(false)
  }

  function renameInventory(event) {
    event.preventDefault()
    const name = inventoryNameDraft.trim()
    if (!name) return

    setInventories((currentInventories) => currentInventories.map((inventory) => (
      inventory.id === activeInventory.id ? { ...inventory, name } : inventory
    )))
    setShowRenameForm(false)
  }

  function updateMarchCount(event) {
    const nextCount = Math.min(20, Math.max(1, Number(event.target.value) || 1))
    setMarchCount(nextCount)
    setMarches((currentMarches) => Array.from({ length: nextCount }, (_, index) => currentMarches[index] || createMarches(nextCount)[index]))
  }

  function updateMarch(marchId, field, value) {
    const isRatioField = troopTypes.some(({ id }) => id === field)
    setMarches((currentMarches) => currentMarches.map((march) => (
      march.id === marchId
        ? {
            ...march,
            [field]: value,
            ...(isRatioField ? { inputMode: 'ratio', unitAllocation: undefined, fillAllocation: undefined } : {}),
            ...(field === 'quantity' ? { fillAllocation: undefined } : {}),
          }
        : march
    )))
  }

  function updateMarchMode(marchId, inputMode) {
    setMarches((currentMarches) => currentMarches.map((march) => {
      if (march.id !== marchId) return march
      if (inputMode === 'ratio') return { ...march, inputMode, unitAllocation: undefined, fillAllocation: undefined }

      const unitAllocation = Object.fromEntries(troopTypes.map(({ id }) => [id, getTroopAmount(march, { id })]))
      const quantity = Object.values(unitAllocation).reduce((sum, amount) => sum + amount, 0)
      return { ...march, inputMode, quantity: String(quantity), unitAllocation, ...getRoundedRatios(unitAllocation, troopPriority), fillAllocation: undefined }
    }))
  }

  function updateMarchUnit(marchId, troopTypeId, value) {
    setMarches((currentMarches) => currentMarches.map((march) => {
      if (march.id !== marchId) return march

      const unitAllocation = march.unitAllocation || Object.fromEntries(troopTypes.map(({ id }) => [id, getTroopAmount(march, { id })]))
      const nextAllocation = { ...unitAllocation, [troopTypeId]: value === '' ? '' : Math.max(0, Number(value) || 0) }
      const quantity = Object.values(nextAllocation).reduce((sum, amount) => sum + (Number(amount) || 0), 0)
      return { ...march, inputMode: 'units', unitAllocation: nextAllocation, quantity: String(quantity), ...getRoundedRatios(nextAllocation, troopPriority), fillAllocation: undefined }
    }))
  }

  function getRatioTotal(march) {
    return Number(march.infantry) + Number(march.cavalry) + Number(march.archery)
  }

  function getTroopAmount(march, troopType) {
    if (march.inputMode === 'units' && march.unitAllocation) return Number(march.unitAllocation[troopType.id]) || 0
    if (march.fillAllocation) return march.fillAllocation[troopType.id] || 0
    return Math.round((Number(march.quantity) || 0) * Number(march[troopType.id]) / 100)
  }

  function getAdjustedRatios(march, availableByType) {
    const requestedTotal = Number(march.quantity) || 0
    const desiredByType = Object.fromEntries(troopTypes.map((troopType) => [
      troopType.id,
      requestedTotal * Number(march[troopType.id]) / 100,
    ]))
    const availableTotal = Object.values(availableByType).reduce((sum, value) => sum + value, 0)
    const targetTotal = availableTotal >= requestedTotal ? requestedTotal : Math.floor(
      Math.min(...troopTypes.filter((troopType) => Number(march[troopType.id]) > 0).map((troopType) => (
        availableByType[troopType.id] * 100 / Number(march[troopType.id])
      ))),
    )
    const targetByType = {}

    if (availableTotal < requestedTotal) {
      troopTypes.forEach((troopType) => {
        targetByType[troopType.id] = targetTotal * Number(march[troopType.id]) / 100
      })
    } else {
      troopTypes.forEach((troopType) => {
        targetByType[troopType.id] = Math.min(desiredByType[troopType.id], availableByType[troopType.id])
      })

      let remainingToFill = requestedTotal - Object.values(targetByType).reduce((sum, value) => sum + value, 0)
      troopPriority.forEach((troopTypeId) => {
        const availableForType = availableByType[troopTypeId] - targetByType[troopTypeId]
        const amount = Math.min(Math.max(0, remainingToFill), availableForType)
        targetByType[troopTypeId] += amount
        remainingToFill -= amount
      })
    }

    const allocatedTotal = Object.values(targetByType).reduce((sum, value) => sum + value, 0)
    const ratios = Object.fromEntries(troopTypes.map((troopType) => [
      troopType.id,
      allocatedTotal > 0 ? Math.round(targetByType[troopType.id] * 100 / allocatedTotal) : Number(march[troopType.id]),
    ]))
    const ratioDifference = 100 - Object.values(ratios).reduce((sum, ratio) => sum + ratio, 0)
    if (ratioDifference !== 0) ratios[troopPriority[0]] += ratioDifference

    return { quantity: Math.floor(allocatedTotal), ratios }
  }

  const marchAllocations = useMemo(() => {
    const remaining = Object.fromEntries(
      units.map((unit) => [`${unit.type}-${unit.level}`, unit.quantity]),
    )

    return marches.map((march) => {
      const availableByType = Object.fromEntries(troopTypes.map((troopType) => [
        troopType.id,
        [...levels].reduce((sum, tier) => sum + (remaining[`${troopType.id}-${tier}`] || 0), 0),
      ]))
      const allocation = troopPriority.map((troopTypeId) => troopTypes.find((troopType) => troopType.id === troopTypeId)).map((troopType) => {
        let remainingToAllocate = getTroopAmount(march, troopType)
        const byTier = []

        for (const tier of [...levels].reverse()) {
          const key = `${troopType.id}-${tier}`
          const available = remaining[key] || 0
          const amount = Math.min(available, remainingToAllocate)
          if (amount > 0) {
            byTier.push({ tier, amount })
            remaining[key] -= amount
            remainingToAllocate -= amount
          }
          if (remainingToAllocate === 0) break
        }

        return {
          ...troopType,
          requested: getTroopAmount(march, troopType),
          allocated: getTroopAmount(march, troopType) - remainingToAllocate,
          byTier,
        }
      })

      return {
        marchId: march.id,
        allocation,
        requestedTotal: Number(march.quantity) || 0,
        allocatedTotal: allocation.reduce((sum, troopType) => sum + troopType.allocated, 0),
        availableByType,
      }
    })
  }, [marches, troopPriority, units])

  const unusedTroops = useMemo(() => {
    const allocatedByKey = {}
    marchAllocations.forEach((march) => {
      march.allocation.forEach((troopType) => {
        troopType.byTier.forEach(({ tier, amount }) => {
          const key = `${troopType.id}-${tier}`
          allocatedByKey[key] = (allocatedByKey[key] || 0) + amount
        })
      })
    })

    return troopTypes.map((troopType) => {
      const byLevel = Object.fromEntries(levels.map((tier) => {
        const key = `${troopType.id}-${tier}`
        const available = units.find((unit) => unit.type === troopType.id && unit.level === tier)?.quantity || 0
        return [tier, Math.max(0, available - (allocatedByKey[key] || 0))]
      }))

      return {
        ...troopType,
        byLevel,
        total: Object.values(byLevel).reduce((sum, value) => sum + value, 0),
      }
    })
  }, [marchAllocations, units])

  const unusedTotal = unusedTroops.reduce((sum, troopType) => sum + troopType.total, 0)
  const unusedRatio = totalUnits > 0 ? Math.round((unusedTotal / totalUnits) * 1000) / 10 : 0

  function adjustMarch(marchAllocation) {
    const march = marches.find((item) => item.id === marchAllocation.marchId)
    const adjustedMarch = getAdjustedRatios(march, marchAllocation.availableByType)
    if (adjustedMarch.quantity <= 0) return

    setMarches((currentMarches) => currentMarches.map((march) => (
      march.id === marchAllocation.marchId
        ? { ...march, quantity: String(adjustedMarch.quantity), inputMode: 'ratio', unitAllocation: undefined, fillAllocation: undefined, ...adjustedMarch.ratios }
        : march
    )))
  }

  function fillLastMarch(marchAllocation) {
    const march = marches.find((item) => item.id === marchAllocation.marchId)
    const requestedTotal = Number(march.quantity) || 0
    const availableTotal = Object.values(marchAllocation.availableByType).reduce((sum, value) => sum + value, 0)
    const targetTotal = Math.min(requestedTotal, availableTotal)
    if (targetTotal <= 0) return

    const fillAllocation = {}
    let remainingToFill = targetTotal
    troopPriority.forEach((troopTypeId) => {
      const amount = Math.min(marchAllocation.availableByType[troopTypeId], remainingToFill)
      fillAllocation[troopTypeId] = amount
      remainingToFill -= amount
    })

    const ratios = Object.fromEntries(troopTypes.map((troopType) => [
      troopType.id,
      Math.floor(fillAllocation[troopType.id] * 100 / targetTotal),
    ]))
    let remainingPercentage = 100 - Object.values(ratios).reduce((sum, ratio) => sum + ratio, 0)
    troopPriority.filter((troopTypeId) => fillAllocation[troopTypeId] > 0).forEach((troopTypeId) => {
      if (remainingPercentage > 0) {
        ratios[troopTypeId] += 1
        remainingPercentage -= 1
      }
    })

    setMarches((currentMarches) => currentMarches.map((march) => (
      march.id === marchAllocation.marchId
        ? { ...march, ...ratios, inputMode: 'units', unitAllocation: fillAllocation, fillAllocation: undefined }
        : march
    )))
  }

  function saveDistribution() {
    setSavedDistributions((currentDistributions) => {
      const distributionData = {
        inventoryId: activeInventory.id,
        inventoryName: activeInventory.name,
        troopPriority: [...troopPriority],
        marches: marches.map((march) => ({ ...march })),
        unusedTroops: unusedTroops.map((troopType) => ({ ...troopType, byLevel: { ...troopType.byLevel } })),
        unusedTotal,
        unusedRatio,
      }

      if (editingDistributionId === null) {
        return [...currentDistributions, {
          ...distributionData,
          id: createDistributionId(),
          name: formationName.trim() || `Formation ${currentDistributions.length + 1}`,
        }]
      }

      const distributionIndex = currentDistributions.findIndex((distribution) => distribution.id === editingDistributionId)
      if (distributionIndex === -1) return currentDistributions

      return currentDistributions.map((distribution, index) => index === distributionIndex ? {
        ...distribution,
        ...distributionData,
        name: formationName.trim() || distribution.name,
      } : distribution)
    })
    setEditingDistributionId(null)
    setShowDistribution(false)
  }

  const activeInventoryDistributions = savedDistributions.filter(
    (distribution) => distribution.inventoryId === activeInventory.id || (!distribution.inventoryId && activeInventory.id === 1),
  )

  function openNewDistribution() {
    setMarchCount(1)
    setMarches([createInventoryMarch(units)])
    setTroopPriority(ratioPriority)
    setFormationName(`Formation ${savedDistributions.length + 1}`)
    setEditingDistributionId(null)
    setShowDistribution(true)
  }

  function openSavedDistribution(distribution) {
    setFormationName(distribution.name)
    setMarches(distribution.marches.map((march) => ({ ...march })))
    setTroopPriority(normalizeTroopPriority(distribution.troopPriority))
    setMarchCount(distribution.marches.length)
    setEditingDistributionId(distribution.id)
    setShowDistribution(true)
  }

  function moveTroopPriority(troopTypeId, direction) {
    setTroopPriority((currentPriority) => {
      const currentIndex = currentPriority.indexOf(troopTypeId)
      const nextIndex = currentIndex + direction
      if (nextIndex < 0 || nextIndex >= currentPriority.length) return currentPriority

      const nextPriority = [...currentPriority]
      ;[nextPriority[currentIndex], nextPriority[nextIndex]] = [nextPriority[nextIndex], nextPriority[currentIndex]]
      return nextPriority
    })
  }

  function deleteSavedDistribution(distributionId) {
    setSavedDistributions((currentDistributions) => currentDistributions.filter((distribution) => distribution.id !== distributionId))
    if (editingDistributionId === distributionId) {
      setEditingDistributionId(null)
      setShowDistribution(false)
    }
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <div>
          <h1>Troop organizer</h1>
        </div>
      </header>

      <InventoryToolbar
        activeInventory={activeInventory}
        inventories={inventories}
        onInventoryChange={(event) => setActiveInventoryId(Number(event.target.value))}
        onRename={() => { setInventoryNameDraft(activeInventory.name); setShowRenameForm((isVisible) => !isVisible) }}
        onNewInventory={() => setShowInventoryForm((isVisible) => !isVisible)}
        showInventoryForm={showInventoryForm}
        showRenameForm={showRenameForm}
        newInventoryName={newInventoryName}
        inventoryNameDraft={inventoryNameDraft}
        onNewInventoryNameChange={(event) => setNewInventoryName(event.target.value)}
        onInventoryNameDraftChange={(event) => setInventoryNameDraft(event.target.value)}
        onCreateInventory={createInventory}
        onRenameInventory={renameInventory}
      />

      <section className="workspace">
        <InventoryEntryPanel
          type={type}
          level={level}
          quantity={quantity}
          troopTypes={troopTypes}
          levels={levels}
          onTypeChange={(event) => setType(event.target.value)}
          onLevelChange={(event) => setLevel(event.target.value)}
          onQuantityChange={(event) => setQuantity(event.target.value)}
          onSubmit={addUnits}
        />
        <InventorySummary units={units} totalUnits={totalUnits} totals={totals} visibleLevels={visibleLevels} onContextMenu={openContextMenu} />
      </section>
      <button className="new-distribution-button" type="button" onClick={openNewDistribution}>
        <span>+</span> New distribution
      </button>
      {showDistribution && <DistributionPanel
        formationName={formationName}
        marchCount={marchCount}
        marches={marches}
        troopTypes={troopTypes}
        troopPriority={troopPriority}
        levels={levels}
        totalUnits={totalUnits}
        unusedTotal={unusedTotal}
        unusedRatio={unusedRatio}
        unusedTroops={unusedTroops}
        marchAllocations={marchAllocations}
        getRatioTotal={getRatioTotal}
        onFormationNameChange={(event) => setFormationName(event.target.value)}
        onTroopPriorityChange={moveTroopPriority}
        onMarchCountChange={updateMarchCount}
        onMarchChange={updateMarch}
        onMarchModeChange={updateMarchMode}
        onMarchUnitChange={updateMarchUnit}
        onFillMarch={fillLastMarch}
        onAdjustMarch={adjustMarch}
        onSave={saveDistribution}
        onClose={() => setShowDistribution(false)}
      />}
      {activeInventoryDistributions.length > 0 && <SavedDistributions
        distributions={activeInventoryDistributions}
        inventoryName={activeInventory.name}
        onOpen={openSavedDistribution}
        onDelete={deleteSavedDistribution}
      />}
      {contextMenu && <ContextMenu menu={contextMenu} onDelete={deleteUnits} />}
    </main>
  )
}

export default App
