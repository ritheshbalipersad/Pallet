# PalletMS Acceptance Test Cases

## AC1 – Admin can create areas and users and assign roles

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login as admin (admin / password123) | Dashboard loads |
| 2 | Go to Admin → Areas | Areas list and add form visible |
| 3 | Add area: Name "Test Area", Type "Warehouse", Capacity 100 | Area appears in list |
| 4 | Go to Admin → Users | Users list and add form visible |
| 5 | Add user: username testop, password test123, role Operator | User appears in list with role Operator |
| 6 | Logout, login as testop / test123 | Login succeeds; operator sees Scan, Reports, no Admin menu |

## AC2 – Operator can scan and create a pallet assigned to an area

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login as operator1 | Dashboard loads |
| 2 | Go to Scan, enter barcode PLT999999 (new) | Lookup returns not found; redirect to Add pallet with barcode prefilled |
| 3 | Select area "Warehouse A", submit | Pallet created; redirect to pallet detail |
| 4 | Pallet detail shows barcode, area, condition Good | Data correct |

## AC3 – Movement lifecycle records Out and In and updates CurrentArea

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login as operator1 | — |
| 2 | Move out: lookup pallet PLT000001, destination "Loading Dock A", Start movement | Movement created, status Pending |
| 3 | Pallet detail or movement list shows Pending movement | From Warehouse A → Loading Dock A |
| 4 | Go to Confirm in, scan/enter PLT000001 | Pending movement for that pallet appears |
| 5 | Confirm in | Movement status Completed; pallet current area = Loading Dock A |
| 6 | Open pallet detail for PLT000001 | Current area = Loading Dock A |

## AC4 – Reports show accurate counts and CSV matches displayed data

| Step | Action | Expected |
|------|--------|----------|
| 1 | Go to Reports → Area summary | Each area shows pallet count; totals consistent |
| 2 | Click Export CSV for Area summary | Redirect to Exports; new export Pending then Completed |
| 3 | Download CSV | File contains same areas and counts as on-screen |
| 4 | Reports → Movement history | List of movements; Export CSV and download | CSV contains movement data |

## AC5 – Audit log records all changes with before/after

| Step | Action | Expected |
|------|--------|----------|
| 1 | Login as admin, go to Admin → Audit log | List of audit entries |
| 2 | Create a new area | Audit log has CREATE for entityType Area, afterData with new area |
| 3 | Edit that area (e.g. change name) | Audit log has UPDATE with beforeData and afterData |
| 4 | Create a pallet | Audit log has CREATE for Pallet |
| 5 | Change pallet condition (e.g. to Damaged) | Audit log has UPDATE with before/after |

## E2E scenarios (automated)

- **Scan-to-add**: Open scan → enter new barcode → add pallet form → submit → pallet detail.
- **Start-move**: Move out with pallet + destination → movement Pending.
- **Confirm-in**: Confirm in for pending movement → status Completed, pallet area updated.
- **Mark-damaged**: Pallet detail → change status to Damaged → save → audit log has UPDATE.
- **Export-report**: Reports → Area summary → Export CSV → Exports list → wait Completed → Download → file exists and has CSV content.
