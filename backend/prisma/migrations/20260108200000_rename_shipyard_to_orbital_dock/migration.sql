-- Rename Raumschiffwerft to Orbitales Raumdock
UPDATE "BuildingType"
SET
  name = 'Orbitales Raumdock',
  description = 'Orbitale Werft fuer den Bau von Raumschiffen. Ermoeglicht den Zugriff auf den modularen Blueprint-Editor.',
  category = 'ORBITAL'
WHERE name = 'Raumschiffwerft';

-- Also update any existing reference that might use old English name
UPDATE "BuildingType"
SET
  name = 'Orbitales Raumdock',
  description = 'Orbitale Werft fuer den Bau von Raumschiffen. Ermoeglicht den Zugriff auf den modularen Blueprint-Editor.',
  category = 'ORBITAL'
WHERE name = 'Shipyard';
