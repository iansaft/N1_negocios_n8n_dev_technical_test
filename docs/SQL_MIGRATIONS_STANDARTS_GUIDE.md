# SQL Migration Standards Guide

This document defines the standard to be followed when creating PostgreSQL migrations for this project. It is intended to guide an AI agent when writing, updating, or reviewing database migrations.

---

## 1. General rules

* Write all migration documentation in **English**, including comments, section titles, notes, and rollback descriptions.
  * Data values inserted/updated/deleted by the migration (for example, seed names and descriptions) may be localized and do not need to be in English.
* Keep the same visual structure across all migrations.
* Use clear, predictable section separators.
* Prefer explicit SQL over implicit behavior.
* Keep the migration readable, consistent, and easy to roll back.
* Do not add unnecessary resources, indexes, or triggers.
* Create only what is required by the current domain model.

---

## 2. File structure

Every migration must follow this order:

1. `-- migrate:up`
2. Header comment block
3. `TYPES`
4. `TABLES`
5. `FUNCTIONS`
6. `TRIGGERS`
7. `INDEXES`
8. `ANALYZE`
9. `-- migrate:down`
10. Header comment block for rollback
11. Drop triggers
12. Drop functions
13. Drop indexes
14. Drop tables
15. Drop types

The order must remain stable unless a dependency requires a different order.

### 2.1 Optional sections

* Do not add empty sections just to match the template.
* A migration may omit a section entirely when it has no statements for that section.
* When a section is present, it must appear in the correct order relative to the other sections.

---

## 3. Section formatting

Use this style for section separators:

```sql
-- ==============================================================================
-- SECTION NAME
-- ==============================================================================
```

Use short and explicit section names such as:

* `TYPES`
* `USERS`
* `CATEGORIES`
* `SUBCATEGORIES`
* `TRANSACTIONS`
* `FUNCTIONS`
* `TRIGGERS`
* `INDEXES`
* `ANALYZE`
* `TABLES (DROP)`
* `FUNCTIONS (DROP)`
* `TRIGGERS (DROP)`
* `TYPES (DROP)`

### 3.1 Seed migrations

* Seed migrations are allowed to use domain-oriented seed sections (for example, `SEED: USERS`, `SEED: CATEGORIES`) instead of forcing empty `TYPES`/`FUNCTIONS`/`TRIGGERS`/`INDEXES` sections.
* Keep section separators consistent, and keep the `ANALYZE` step at the end of the `-- migrate:up` section when relevant.

---

## 4. Naming rules

### 4.1 Tables and columns

* Use lowercase names with underscores.
* Keep names explicit and domain-oriented.
* Prefer singular or plural consistently within the same module.
* Use the same naming style across the whole database.

### 4.2 Primary keys

* Use UUID primary keys.
* Name them with the pattern:

  * `user_id`
  * `category_id`
  * `subcategory_id`
  * `transaction_id`

### 4.3 Foreign keys

* Use explicit foreign key references.
* Always specify `ON DELETE` behavior when relevant.
* Prefer `ON DELETE CASCADE` when child records must be removed with the parent.

### 4.4 Constraints

* Name constraints explicitly.
* Use descriptive constraint names.
* For unique constraints, use this style:

  * `unique_user_email`
  * `unique_user_phone_number`
  * `unique_category_name`
  * `unique_transaction_user_code`

### 4.5 Indexes

* Name indexes explicitly.
* Use descriptive index names.
* Keep names aligned with the indexed purpose.

Examples:

* `idx_users_email`
* `idx_transactions_user_date`
* `idx_subcategories_custom_name`

---

## 5. Column rules

### 5.1 Required columns

For most tables, include:

* UUID primary key
* business fields
* `created_at`
* `updated_at`

When the entity supports soft delete, also include:

* `deleted_at`
* `deletion_reason`

### 5.2 Timestamps

* Use `TIMESTAMPTZ` for timestamps.
* `created_at` should default to `CURRENT_TIMESTAMP`.
* `updated_at` should default to `CURRENT_TIMESTAMP`.
* Use a trigger to update `updated_at` automatically before updates.

### 5.3 Soft delete

* Use soft delete when the entity must preserve historical records.
* Prefer `deleted_at` and `deletion_reason`.
* Add partial indexes filtered by `deleted_at IS NULL` when needed for active records.

### 5.4 Data types

Use appropriate types:

* `UUID` for identifiers
* `VARCHAR(n)` for bounded text
* `TEXT` for open-ended text
* `BOOLEAN` for flags
* `DATE` for calendar dates
* `TIMESTAMPTZ` for date and time with timezone
* `DECIMAL(p, s)` for monetary values
* `CHAR(n)` only when a fixed-size value is required

---

## 6. Constraint rules

### 6.1 Unique constraints

* Always declare unique constraints at the end of the `CREATE TABLE` statement.
* Use named `CONSTRAINT` syntax.
* Do not write inline `UNIQUE` unless there is a strong reason.

Example:

```sql
CONSTRAINT unique_user_email UNIQUE (email),
CONSTRAINT unique_user_phone_number UNIQUE (phone_number)
```

### 6.2 Check constraints

* Use `CHECK` constraints for business rules that must be enforced by the database.
* Name them explicitly.
* Keep the expression simple and readable.

Examples:

* non-empty names
* valid transaction sign by type
* origin rules for default vs custom records

### 6.3 Partial unique indexes

* Use partial unique indexes when uniqueness depends on a condition.
* Keep them only when a normal unique constraint is not enough.

---

## 7. Trigger rules

### 7.1 update_updated_at trigger

* Reuse a single `update_updated_at()` function when possible.
* The function must set `NEW.updated_at = CURRENT_TIMESTAMP`.
* Attach the trigger as `BEFORE UPDATE` on each table that uses timestamp tracking.

### 7.2 Domain triggers

* Use triggers only when the database must enforce derived data or consistency rules.
* Keep trigger logic small and deterministic.
* Avoid overusing triggers when a constraint or direct model change is enough.

### 7.3 Trigger naming

Use the pattern:

* `trig_<table>_update`
* `trig_<action>_<resource>`

Examples:

* `trig_users_update`
* `trig_transactions_update`
* `trig_set_transaction_category`

---

## 8. Function rules

* Use `CREATE OR REPLACE FUNCTION`.
* Prefer `plpgsql` when logic is required.
* Keep function names descriptive.
* Functions used by triggers should return `TRIGGER`.
* Keep business logic in the database only when it improves consistency and maintainability.

---

## 9. Index rules

### 9.1 Purpose

Indexes must be created only for one of these reasons:

* enforce a rule with uniqueness
* improve a high-value query path
* optimize report queries
* accelerate join-heavy access patterns

### 9.2 Avoid unnecessary indexes

* Do not create indexes for hypothetical queries.
* Do not duplicate coverage across multiple indexes unless the workload requires it.
* Prefer a smaller number of high-value indexes.

### 9.3 Common patterns

Use indexes for:

* lookups by name
* list-by-user queries
* date range queries
* joins on foreign keys
* report filters
* dashboard aggregations

### 9.4 Partial indexes

* Use partial indexes for active records when soft delete exists.
* Use partial unique indexes when only a subset of rows must be unique.

### 9.5 Rule vs performance

Separate index intent clearly:

* **Rule indexes**: unique constraints or unique indexes that protect data integrity
* **Performance indexes**: non-unique indexes created for query speed

---

## 10. Modeling rules for categories and subcategories

### 10.1 Default and custom records

When a model supports both default and user-specific records:

* keep the distinction explicit
* use a flag such as `is_default`
* validate the origin with a `CHECK` constraint

Example rule:

* `is_default = TRUE` implies `user_id IS NULL`
* `is_default = FALSE` implies `user_id IS NOT NULL`

### 10.2 Denormalized category reference in transactions

When `transactions` stores `category_id` in addition to `subcategory_id`:

* treat `category_id` as a derived field
* fill it consistently from the chosen subcategory
* keep the logic centralized in a trigger if needed
* ensure the column is covered by the correct query indexes

### 10.3 Subcategory ownership

When subcategories can be global or user-specific:

* model the ownership explicitly
* do not rely on ambiguous null semantics unless the schema rule is clearly enforced
* make sure the seed data matches the schema rule exactly

---

## 11. Seed data rules

### 11.1 Fixed UUIDs

* Use hardcoded UUIDs for system seed data when consistency across environments is required.
* Keep UUIDs stable across all environments.
* Never change seeded UUIDs unless the data model changes intentionally.

### 11.2 Idempotency

* Seed migrations should be safe to run multiple times.
* Use `ON CONFLICT` when you want the seed to update existing rows instead of failing.
* Use `ON CONFLICT DO NOTHING` when the seed should only insert missing rows.

### 11.3 Conflict target

* Choose the conflict target intentionally.
* Make sure the target matches the identity rule of the seed record.
* If the table has other unique constraints, confirm they will not cause unexpected failures.

### 11.4 Seed compatibility

* Seed rows must match current table constraints.
* If a new `CHECK` constraint or required column is added, update the seed accordingly.
* Never assume old seed shape still works after schema changes.

---

## 12. Rollback rules

Rollback must mirror the up migration cleanly.

### 12.1 Drop order

Use this order:

1. Triggers
2. Functions
3. Indexes
4. Tables
5. Types

### 12.2 Safety

* Use `IF EXISTS` for drop statements.
* Keep rollback explicit and complete.
* Remove all objects created in the `up` section.
* Do not forget indexes, functions, or triggers.

### 12.3 Shared objects

* If a function is shared by more than one migration, do not drop it blindly in a module rollback unless that is intentionally safe.
* Shared helper functions should ideally live in a dedicated migration.

---

## 13. Analyze rules

* Run `ANALYZE` on all tables created or heavily used by the migration.
* Place `ANALYZE` at the end of the `up` section.
* Include only the relevant tables.

Example:

```sql
ANALYZE categories;
ANALYZE subcategories;
ANALYZE transactions;
```

---

## 14. Writing style rules

* Use short, direct comments.
* Keep comments factual.
* Avoid filler text.
* Avoid long explanations inside migrations.
* Write comments only when they improve readability.
* Keep the style consistent across all files.

Recommended comment language:

* English only

Recommended comment tone:

* technical
* brief
* neutral

---

## 15. Validation checklist for the AI agent

Before finalizing any migration, verify:

* [ ] All migration documentation text is in English (comments, section titles, notes, rollback descriptions)
* [ ] Section order is correct
* [ ] Table columns match the intended schema
* [ ] Constraints are named and correctly placed
* [ ] Soft delete fields are present where needed
* [ ] Trigger functions exist before trigger creation
* [ ] Indexes match real query needs
* [ ] Unique constraints are correctly modeled
* [ ] Seed data respects all current constraints
* [ ] Rollback removes every object created in `up`
* [ ] `ANALYZE` is present for relevant tables
* [ ] No outdated references remain after schema changes

---

## 16. Recommended default conventions

When in doubt, prefer:

* explicit named constraints at the end of `CREATE TABLE`
* `TIMESTAMPTZ` for timestamps
* `UUID` primary keys with `gen_random_uuid()`
* `ON DELETE CASCADE` for dependent child tables
* partial indexes for active rows
* trigger-based `updated_at` handling
* stable hardcoded UUIDs for seed data
* concise English comments

---

## 17. Final principle

The migration should always prioritize:

1. correctness
2. consistency
3. readability
4. rollback safety
5. query performance

If a choice improves one area but weakens several others, prefer the simpler and safer design.
