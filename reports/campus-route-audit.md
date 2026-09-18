# Campus route audit

Checked: 2026-09-18T12:39:37.287Z
Published revision: b9eec49a-1c0b-44a9-a48b-549677b164f9

Uses the published destination pins, the repository campus boundary, and the default walking/vehicle routing services. Both directions are checked. Missing endpoints are classified from nearest-path distances without requesting an impossible route. This does not verify physical accessibility or routes from every possible GPS position.

Destinations inside boundary: 15/15

## walking

{"inside-campus":20,"NoRoute":112,"endpoint-too-far":78}

| Destination | Nearest mapped path (m) | Within snap limit | Snapped inside campus |
|---|---:|---|---|
| admin block | 21.4 | yes | yes |
| SNS Lawn | 17.9 | yes | yes |
| ai campus | 0.2 | yes | yes |
| Dtplayhouse | 10.7 | yes | yes |
| spine | 21.5 | yes | yes |
| playground | 27.4 | yes | yes |
| CGC building | 46.5 | no | yes |
| sns clinic | 24.3 | yes | no |
| temple | 30.3 | no | no |
| sns Ihub | 16.4 | yes | yes |
| plane view | 15.5 | yes | yes |
| chanakya hall | 2.9 | yes | yes |
| buddha | 26.1 | yes | yes |
| building | 21.1 | yes | yes |
| sns open autorium | 51.9 | no | yes |

### Routes leaving campus

None among returned routes.

### All destination pairs

I = inside campus; O = leaves campus; E = endpoint beyond snap limit; N = no connected route; ? = other service result.

| From / To | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. admin block | — | I | N | N | N | N | E | N | E | N | I | N | I | N | E |
| 2. SNS Lawn | I | — | N | N | N | N | E | N | E | N | I | N | I | N | E |
| 3. ai campus | N | N | — | I | N | I | E | N | E | N | N | N | N | N | E |
| 4. Dtplayhouse | N | N | I | — | N | I | E | N | E | N | N | N | N | N | E |
| 5. spine | N | N | N | N | — | N | E | N | E | N | N | N | N | I | E |
| 6. playground | N | N | I | I | N | — | E | N | E | N | N | N | N | N | E |
| 7. CGC building | E | E | E | E | E | E | — | E | E | E | E | E | E | E | E |
| 8. sns clinic | N | N | N | N | N | N | E | — | E | N | N | N | N | N | E |
| 9. temple | E | E | E | E | E | E | E | E | — | E | E | E | E | E | E |
| 10. sns Ihub | N | N | N | N | N | N | E | N | E | — | N | N | N | N | E |
| 11. plane view | I | I | N | N | N | N | E | N | E | N | — | N | I | N | E |
| 12. chanakya hall | N | N | N | N | N | N | E | N | E | N | N | — | N | N | E |
| 13. buddha | I | I | N | N | N | N | E | N | E | N | I | N | — | N | E |
| 14. building | N | N | N | N | I | N | E | N | E | N | N | N | N | — | E |
| 15. sns open autorium | E | E | E | E | E | E | E | E | E | E | E | E | E | E | — |

## vehicle

{"inside-campus":132,"leaves-campus":50,"endpoint-too-far":28}

| Destination | Nearest mapped path (m) | Within snap limit | Snapped inside campus |
|---|---:|---|---|
| admin block | 21.4 | yes | yes |
| SNS Lawn | 17.9 | yes | yes |
| ai campus | 0.2 | yes | yes |
| Dtplayhouse | 44.2 | yes | yes |
| spine | 21.5 | yes | yes |
| playground | 27.4 | yes | yes |
| CGC building | 46.5 | yes | yes |
| sns clinic | 24.3 | yes | no |
| temple | 30.3 | yes | no |
| sns Ihub | 16.4 | yes | yes |
| plane view | 15.5 | yes | yes |
| chanakya hall | 25.1 | yes | yes |
| buddha | 26.1 | yes | yes |
| building | 21.1 | yes | yes |
| sns open autorium | 51.9 | no | yes |

### Routes leaving campus

- admin block → sns clinic: 194 m
- admin block → temple: 354 m
- SNS Lawn → sns clinic: 137 m
- SNS Lawn → temple: 298 m
- ai campus → sns clinic: 470 m
- ai campus → temple: 767 m
- Dtplayhouse → sns clinic: 426 m
- Dtplayhouse → temple: 722 m
- spine → sns clinic: 555 m
- spine → temple: 843 m
- playground → sns clinic: 485 m
- playground → temple: 781 m
- CGC building → sns clinic: 215 m
- CGC building → temple: 375 m
- sns clinic → admin block: 194 m
- sns clinic → SNS Lawn: 137 m
- sns clinic → ai campus: 470 m
- sns clinic → Dtplayhouse: 426 m
- sns clinic → spine: 555 m
- sns clinic → playground: 485 m
- sns clinic → CGC building: 215 m
- sns clinic → temple: 300 m
- sns clinic → sns Ihub: 324 m
- sns clinic → plane view: 113 m
- sns clinic → chanakya hall: 348 m
- sns clinic → buddha: 139 m
- sns clinic → building: 558 m
- temple → admin block: 354 m
- temple → SNS Lawn: 298 m
- temple → ai campus: 767 m
- temple → Dtplayhouse: 722 m
- temple → spine: 843 m
- temple → playground: 781 m
- temple → CGC building: 375 m
- temple → sns clinic: 300 m
- temple → sns Ihub: 484 m
- temple → plane view: 273 m
- temple → chanakya hall: 508 m
- temple → buddha: 299 m
- temple → building: 847 m
- sns Ihub → sns clinic: 324 m
- sns Ihub → temple: 484 m
- plane view → sns clinic: 113 m
- plane view → temple: 273 m
- chanakya hall → sns clinic: 348 m
- chanakya hall → temple: 508 m
- buddha → sns clinic: 139 m
- buddha → temple: 299 m
- building → sns clinic: 558 m
- building → temple: 847 m

### All destination pairs

I = inside campus; O = leaves campus; E = endpoint beyond snap limit; N = no connected route; ? = other service result.

| From / To | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1. admin block | — | I | I | I | I | I | I | O | O | I | I | I | I | I | E |
| 2. SNS Lawn | I | — | I | I | I | I | I | O | O | I | I | I | I | I | E |
| 3. ai campus | I | I | — | I | I | I | I | O | O | I | I | I | I | I | E |
| 4. Dtplayhouse | I | I | I | — | I | I | I | O | O | I | I | I | I | I | E |
| 5. spine | I | I | I | I | — | I | I | O | O | I | I | I | I | I | E |
| 6. playground | I | I | I | I | I | — | I | O | O | I | I | I | I | I | E |
| 7. CGC building | I | I | I | I | I | I | — | O | O | I | I | I | I | I | E |
| 8. sns clinic | O | O | O | O | O | O | O | — | O | O | O | O | O | O | E |
| 9. temple | O | O | O | O | O | O | O | O | — | O | O | O | O | O | E |
| 10. sns Ihub | I | I | I | I | I | I | I | O | O | — | I | I | I | I | E |
| 11. plane view | I | I | I | I | I | I | I | O | O | I | — | I | I | I | E |
| 12. chanakya hall | I | I | I | I | I | I | I | O | O | I | I | — | I | I | E |
| 13. buddha | I | I | I | I | I | I | I | O | O | I | I | I | — | I | E |
| 14. building | I | I | I | I | I | I | I | O | O | I | I | I | I | — | E |
| 15. sns open autorium | E | E | E | E | E | E | E | E | E | E | E | E | E | E | — |
