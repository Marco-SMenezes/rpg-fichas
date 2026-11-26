#!/usr/bin/env bash
# Testa as migrações e o RLS num Postgres local descartável (cria o banco tomo_teste).
# A conexão vem das variáveis padrão do psql, por exemplo:
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres supabase/testes/rodar.sh
set -euo pipefail
export PGOPTIONS='-c client_min_messages=warning'
cd "$(dirname "$0")/.."
psql -d postgres -q -v ON_ERROR_STOP=1 -c 'drop database if exists tomo_teste' -c 'create database tomo_teste'
rodar() { psql -d tomo_teste -q -v ON_ERROR_STOP=1 -f "$1"; }
rodar testes/simular-supabase.sql
for f in migrations/*.sql; do
  rodar "$f"
  rodar "$f" # de novo: as migrações devem poder rodar duas vezes
done
psql -d tomo_teste -q -v ON_ERROR_STOP=1 -o /dev/null -f testes/rls.sql 2>&1 | sed -n -e "s/.*NOTICE:  //p" -e "/ERROR/p"
echo "RLS: tudo certo"
