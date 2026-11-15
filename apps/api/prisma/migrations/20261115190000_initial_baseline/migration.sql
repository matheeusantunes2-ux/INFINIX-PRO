"
[36;1mecho "=== PRISMA_BASELINE_SQL_BEGIN ==="[0m
[36;1mnpx prisma migrate diff --from-empty --to-schema-datamodel apps/api/prisma/schema.prisma --script[0m
[36;1mecho "
