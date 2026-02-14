-- PalletMS initial schema (SQL Server / T-SQL)

-- Roles and permissions
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
CREATE TABLE roles (
  role_id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL UNIQUE,
  permissions NVARCHAR(MAX) NOT NULL DEFAULT '[]'
);

-- Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
  user_id INT IDENTITY(1,1) PRIMARY KEY,
  username NVARCHAR(100) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  display_name NVARCHAR(200),
  email NVARCHAR(255),
  role_id INT NOT NULL,
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_username' AND object_id = OBJECT_ID('users'))
CREATE INDEX idx_users_username ON users(username);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_users_role' AND object_id = OBJECT_ID('users'))
CREATE INDEX idx_users_role ON users(role_id);

-- Areas
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'areas')
CREATE TABLE areas (
  area_id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(200) NOT NULL,
  type NVARCHAR(50),
  parent_area_id INT,
  capacity INT,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET()
);
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'fk_areas_parent')
BEGIN
  ALTER TABLE areas ADD CONSTRAINT fk_areas_parent FOREIGN KEY (parent_area_id) REFERENCES areas(area_id);
END
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_areas_parent' AND object_id = OBJECT_ID('areas'))
CREATE INDEX idx_areas_parent ON areas(parent_area_id);

-- Pallets
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'pallets')
CREATE TABLE pallets (
  pallet_id INT IDENTITY(1,1) PRIMARY KEY,
  barcode NVARCHAR(100) NOT NULL,
  type NVARCHAR(50),
  size NVARCHAR(50),
  condition_status NVARCHAR(50) NOT NULL DEFAULT 'Good',
  current_area_id INT,
  owner NVARCHAR(200),
  created_by INT NOT NULL,
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  deleted_at DATETIMEOFFSET,
  CONSTRAINT fk_pallets_area FOREIGN KEY (current_area_id) REFERENCES areas(area_id),
  CONSTRAINT fk_pallets_creator FOREIGN KEY (created_by) REFERENCES users(user_id),
  CONSTRAINT uq_pallets_barcode UNIQUE (barcode)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pallets_current_area' AND object_id = OBJECT_ID('pallets'))
CREATE INDEX idx_pallets_current_area ON pallets(current_area_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pallets_condition' AND object_id = OBJECT_ID('pallets'))
CREATE INDEX idx_pallets_condition ON pallets(condition_status);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_pallets_created_at' AND object_id = OBJECT_ID('pallets'))
CREATE INDEX idx_pallets_created_at ON pallets(created_at);

-- Movements
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'movements')
CREATE TABLE movements (
  movement_id INT IDENTITY(1,1) PRIMARY KEY,
  pallet_id INT NOT NULL,
  from_area_id INT,
  to_area_id INT NOT NULL,
  out_by INT NOT NULL,
  out_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  in_by INT,
  in_at DATETIMEOFFSET,
  eta DATETIMEOFFSET,
  movement_status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
  notes NVARCHAR(MAX),
  created_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  updated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT fk_movements_pallet FOREIGN KEY (pallet_id) REFERENCES pallets(pallet_id),
  CONSTRAINT fk_movements_from_area FOREIGN KEY (from_area_id) REFERENCES areas(area_id),
  CONSTRAINT fk_movements_to_area FOREIGN KEY (to_area_id) REFERENCES areas(area_id),
  CONSTRAINT fk_movements_out_by FOREIGN KEY (out_by) REFERENCES users(user_id),
  CONSTRAINT fk_movements_in_by FOREIGN KEY (in_by) REFERENCES users(user_id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_movements_pallet' AND object_id = OBJECT_ID('movements'))
CREATE INDEX idx_movements_pallet ON movements(pallet_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_movements_status' AND object_id = OBJECT_ID('movements'))
CREATE INDEX idx_movements_status ON movements(movement_status);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_movements_out_at' AND object_id = OBJECT_ID('movements'))
CREATE INDEX idx_movements_out_at ON movements(out_at);

-- Audit log
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_log')
CREATE TABLE audit_log (
  audit_id BIGINT IDENTITY(1,1) PRIMARY KEY,
  entity_type NVARCHAR(100) NOT NULL,
  entity_id NVARCHAR(100) NOT NULL,
  action NVARCHAR(50) NOT NULL,
  changed_by INT,
  changed_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  before_data NVARCHAR(MAX),
  after_data NVARCHAR(MAX),
  CONSTRAINT fk_audit_user FOREIGN KEY (changed_by) REFERENCES users(user_id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_entity' AND object_id = OBJECT_ID('audit_log'))
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_changed_at' AND object_id = OBJECT_ID('audit_log'))
CREATE INDEX idx_audit_changed_at ON audit_log(changed_at);

-- Exports
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'exports')
CREATE TABLE exports (
  export_id INT IDENTITY(1,1) PRIMARY KEY,
  report_type NVARCHAR(100) NOT NULL,
  parameters NVARCHAR(MAX) DEFAULT '{}',
  generated_by INT NOT NULL,
  generated_at DATETIMEOFFSET NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  file_path NVARCHAR(500),
  status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
  CONSTRAINT fk_exports_user FOREIGN KEY (generated_by) REFERENCES users(user_id)
);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_exports_user' AND object_id = OBJECT_ID('exports'))
CREATE INDEX idx_exports_user ON exports(generated_by);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_exports_generated_at' AND object_id = OBJECT_ID('exports'))
CREATE INDEX idx_exports_generated_at ON exports(generated_at);
