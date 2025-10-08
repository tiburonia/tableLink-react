#!/bin/bash

# TableLink 데이터베이스 복원 스크립트
# 사용법: ./restore_database.sh <DATABASE_URL>

if [ -z "$1" ]; then
  echo "❌ 사용법: ./restore_database.sh <DATABASE_URL>"
  echo "예시: ./restore_database.sh postgresql://user:pass@host/dbname"
  exit 1
fi

DATABASE_URL="$1"
DUMP_FILE="tablelink_full_dump_20251008_101231.sql"

echo "📦 TableLink 데이터베이스 복원 시작..."
echo "🔗 대상 DB: ${DATABASE_URL%%@*}@***"
echo "📁 덤프 파일: $DUMP_FILE"
echo ""

# 덤프 파일 존재 확인
if [ ! -f "$DUMP_FILE" ]; then
  echo "❌ 덤프 파일을 찾을 수 없습니다: $DUMP_FILE"
  exit 1
fi

# 데이터베이스 복원
echo "🔄 데이터베이스 복원 중..."
psql "$DATABASE_URL" < "$DUMP_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ 데이터베이스 복원 완료!"
  echo ""
  echo "📊 복원된 테이블:"
  psql "$DATABASE_URL" -c "\dt" 2>/dev/null | grep public || echo "테이블 목록을 가져올 수 없습니다."
else
  echo ""
  echo "❌ 데이터베이스 복원 실패"
  exit 1
fi
