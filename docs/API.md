# PalletMS API Reference

Base URL: `/api` (e.g. `http://localhost:3000/api`)

Authentication: Bearer JWT in `Authorization` header after `POST /auth/login`.

## OpenAPI

Interactive docs: `http://localhost:3000/api/docs` (Swagger UI).

Full spec: project root `openapi.yaml`.

## Endpoints summary

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Login (username, password) → JWT + user |
| GET | /auth/profile | Current user (requires auth) |
| GET/POST | /areas, /areas/:id | Areas CRUD |
| GET/POST/PATCH/DELETE | /pallets | Pallets CRUD |
| GET | /pallets/lookup/:barcode | Lookup by barcode |
| GET/POST | /movements | List / start movement (move out) |
| POST | /movements/:id/confirm | Confirm in |
| GET | /roles | List roles |
| GET/POST/PATCH | /users | Users (admin) |
| GET | /reports/area-summary | Area summary report |
| GET | /reports/pallet-status | Pallet status counts |
| GET | /reports/movement-history | Movement history |
| GET | /reports/lost-damaged | Lost/Damaged/Stolen/Unfit list |
| GET | /reports/overdue-inbound | Overdue pending movements |
| POST | /exports | Request CSV export (async) |
| GET | /exports | List my exports |
| GET | /exports/:id/download | Download export file |
| GET | /audit-log | Query audit log |

## Example payloads

**Create pallet**
```json
{
  "barcode": "PLT000101",
  "type": "Euro",
  "size": "120x80",
  "currentAreaId": 1,
  "owner": "Acme Corp"
}
```

**Start movement (move out)**
```json
{
  "palletId": 1,
  "toAreaId": 3,
  "eta": "2025-02-15T12:00:00Z",
  "notes": "Dock A"
}
```

**Confirm movement (move in)**
```json
{
  "notes": "Received at dock"
}
```

**Request export**
```json
{
  "reportType": "area-summary",
  "parameters": {}
}
```
