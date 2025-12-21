#!/bin/bash

# CSS Module 리팩토링 자동화 스크립트
# TableLink 프로젝트의 모든 CSS 파일을 CSS Module로 변환

set -e

echo "🎨 CSS Module 리팩토링 시작..."
echo "================================"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 작업 디렉토리
WORK_DIR="/workspaces/tableLink-react/TableLink/src"
cd "$WORK_DIR"

# 변환할 파일 개수 카운트
total_files=$(find . -name "*.css" ! -name "*.module.css" ! -path "*/node_modules/*" | wc -l)
echo "📊 총 ${total_files}개의 CSS 파일 발견"
echo ""

converted=0
skipped=0
errors=0

# CSS 파일을 CSS Module로 변환하는 함수
convert_to_module() {
    local css_file="$1"
    local dir=$(dirname "$css_file")
    local basename=$(basename "$css_file" .css)
    local module_file="${dir}/${basename}.module.css"
    
    # 이미 module.css가 존재하면 스킵
    if [ -f "$module_file" ]; then
        echo "${YELLOW}⏭️  스킵: ${module_file} (이미 존재)${NC}"
        ((skipped++))
        return
    fi
    
    # variables.css는 스킵
    if [[ "$basename" == "variables" ]] || [[ "$basename" == "index" ]]; then
        echo "${YELLOW}⏭️  스킵: ${css_file} (공통 파일)${NC}"
        ((skipped++))
        return
    fi
    
    echo "${GREEN}🔄 변환 중: ${css_file} → ${module_file}${NC}"
    
    # CSS 파일을 module.css로 복사 (실제 변환은 수동으로 필요)
    cp "$css_file" "$module_file"
    
    ((converted++))
}

# 모든 CSS 파일 탐색 및 변환
find . -name "*.css" ! -name "*.module.css" ! -path "*/node_modules/*" -type f | while read css_file; do
    convert_to_module "$css_file" || {
        echo "${RED}❌ 에러: ${css_file} 변환 실패${NC}"
        ((errors++))
    }
done

echo ""
echo "================================"
echo "✅ 리팩토링 완료!"
echo "   - 변환됨: ${converted}개"
echo "   - 스킵됨: ${skipped}개"
echo "   - 에러: ${errors}개"
echo ""
echo "⚠️  다음 단계:"
echo "   1. TSX 파일에서 import 경로 변경 (.css → .module.css)"
echo "   2. className을 styles.className으로 변경"
echo "   3. import styles from './Component.module.css' 추가"
echo "   4. 기존 .css 파일 삭제 (변환 확인 후)"

