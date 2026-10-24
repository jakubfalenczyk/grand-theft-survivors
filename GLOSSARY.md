# Grand Theft Survivors

Terms used in the game and planned features. Planned gameplay terms do not imply an implemented feature.

## City

**City layout**:
The positions, dimensions and contents of a city, including its buildings, streets and parks.
_Avoid_: City renderer, city scene.

**District**:
An area of a city with its own appearance and population. A district and a faction are separate concepts.
_Avoid_: Faction, gang territory when referring only to a material palette.

**Building footprint**:
The area a building occupies at ground level. It determines which ground positions the building blocks.
_Avoid_: Roof bounds, projected building.

**Projected roof**:
The visible roof position and size after accounting for building height and camera position.
_Avoid_: Building footprint.

**City map**:
The navigation view of the city. It is distinct from the city layout the player explores.
_Avoid_: Map when the distinction from city layout matters.

## Planned gameplay

**Run**:
One attempt to complete a city's objective, starting with a pistol and ending in victory or defeat.
_Avoid_: Session when referring to one gameplay attempt.

**Faction**:
One of a city's three gangs or its police force.
_Avoid_: District, enemy type.

**Hostility**:
A faction's accumulated opposition to the player during a run. Its thresholds determine when that faction sends bosses.
_Avoid_: Reputation without an explicit direction, wanted level for a gang's hostility.

**Boss chain**:
A faction's ordered set of four bosses. Defeating the fourth boss in any one faction's chain completes the city.
_Avoid_: Timed boss wave.

**Weapon rank**:
The upgrade progress of one weapon. The rank limit remains a design proposal.
_Avoid_: Character level.

**Character level**:
The player's progression through XP rewards during a run. Each level offers a choice of upgrades.
_Avoid_: Weapon rank.

**Weapon union**:
An evolution that replaces two maxed weapons with one stronger weapon.
_Avoid_: Ordinary weapon upgrade.
