const fs = require('fs');
const path = require('path');

/**
 * CSS를 CSS Module로 자동 변환하는 스크립트
 * 사용법: node scripts/css-to-module-converter.js <대상폴더>
 */

// 케밥 케이스를 카멜 케이스로 변환
function kebabToCamel(str) {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

// CSS 클래스명을 카멜 케이스로 변환
function convertCSSToModule(cssContent) {
  // 클래스 선택자 변환 (.class-name -> .className)
  let converted = cssContent.replace(/\.([a-z][a-z0-9-]*)/gi, (match, className) => {
    // 전역 클래스는 제외
    if (className.startsWith('mobile-app') || className.startsWith('device-')) {
      return match;
    }
    return '.' + kebabToCamel(className);
  });

  // 색상 값을 CSS 변수로 변환
  const colorMap = {
    '#ff6b35': 'var(--color-primary)',
    '#e85a2a': 'var(--color-primary-hover)',
    '#212529': 'var(--color-text-primary)',
    '#6c757d': 'var(--color-text-secondary)',
    '#adb5bd': 'var(--color-text-tertiary)',
    '#f8f9fa': 'var(--color-bg-secondary)',
    '#ffffff': 'var(--color-bg-primary)',
    '#e9ecef': 'var(--color-border-light)',
  };

  Object.entries(colorMap).forEach(([oldColor, newVar]) => {
    const regex = new RegExp(oldColor, 'gi');
    converted = converted.replace(regex, newVar);
  });

  // 고정 값을 CSS 변수로 변환
  converted = converted.replace(/padding:\s*(\d+)px/g, (match, value) => {
    const spacing = {
      '4': 'var(--spacing-xs)',
      '8': 'var(--spacing-sm)',
      '16': 'var(--spacing-md)',
      '24': 'var(--spacing-lg)',
      '32': 'var(--spacing-xl)',
    };
    return spacing[value] ? `padding: ${spacing[value]}` : match;
  });

  converted = converted.replace(/font-size:\s*(\d+)px/g, (match, value) => {
    const fontSize = {
      '12': 'var(--font-size-xs)',
      '14': 'var(--font-size-sm)',
      '16': 'var(--font-size-md)',
      '18': 'var(--font-size-lg)',
      '20': 'var(--font-size-xl)',
    };
    return fontSize[value] ? `font-size: ${fontSize[value]}` : match;
  });

  converted = converted.replace(/border-radius:\s*(\d+)px/g, (match, value) => {
    const radius = {
      '4': 'var(--radius-sm)',
      '8': 'var(--radius-md)',
      '12': 'var(--radius-lg)',
      '16': 'var(--radius-xl)',
    };
    return radius[value] ? `border-radius: ${radius[value]}` : match;
  });

  return converted;
}

// TSX 파일의 className 변환
function convertTSXToModule(tsxContent, componentName) {
  let converted = tsxContent;

  // import 문 추가 (CSS import 찾아서 변경)
  converted = converted.replace(
    /import\s+['"]\.\/([^'"]+)\.css['"]/,
    `import styles from './$1.module.css'`
  );

  // className 변환
  converted = converted.replace(
    /className=["']([a-z][a-z0-9-]*)["']/gi,
    (match, className) => {
      const camelClass = kebabToCamel(className);
      return `className={styles.${camelClass}}`;
    }
  );

  // 복합 className 변환 (공백 포함)
  converted = converted.replace(
    /className=["']([a-z][a-z0-9-]*(?:\s+[a-z][a-z0-9-]*)*)["']/gi,
    (match, classNames) => {
      const classes = classNames.split(/\s+/).map(cn => `styles.${kebabToCamel(cn)}`).join(', ');
      return `className={clsx(${classes})}`;
    }
  );

  return converted;
}

// 디렉토리 재귀 처리
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let stats = { css: 0, tsx: 0, skipped: 0 };

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const subStats = processDirectory(filePath);
      stats.css += subStats.css;
      stats.tsx += subStats.tsx;
      stats.skipped += subStats.skipped;
      return;
    }

    // CSS 파일 처리
    if (file.endsWith('.css') && !file.endsWith('.module.css')) {
      // 특수 파일 스킵
      if (file === 'variables.css' || file === 'index.css') {
        stats.skipped++;
        return;
      }

      const cssContent = fs.readFileSync(filePath, 'utf8');
      const modulePath = filePath.replace('.css', '.module.css');

      // 이미 존재하면 스킵
      if (fs.existsSync(modulePath)) {
        console.log(`⏭️  스킵: ${modulePath} (이미 존재)`);
        stats.skipped++;
        return;
      }

      const convertedCSS = convertCSSToModule(cssContent);
      fs.writeFileSync(modulePath, convertedCSS);
      console.log(`✅ CSS 변환: ${filePath} → ${modulePath}`);
      stats.css++;
    }

    // TSX 파일 처리
    if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const tsxContent = fs.readFileSync(filePath, 'utf8');
      
      // CSS import가 없으면 스킵
      if (!tsxContent.includes('.css\'') && !tsxContent.includes('.css"')) {
        return;
      }

      const convertedTSX = convertTSXToModule(tsxContent, file.replace(/\.tsx?$/, ''));
      
      // 변경사항이 있으면 저장
      if (convertedTSX !== tsxContent) {
        // 백업 생성
        fs.writeFileSync(filePath + '.backup', tsxContent);
        fs.writeFileSync(filePath, convertedTSX);
        console.log(`✅ TSX 변환: ${filePath}`);
        stats.tsx++;
      }
    }
  });

  return stats;
}

// 메인 실행
function main() {
  const targetDir = process.argv[2] || './src/pages/Store';
  const fullPath = path.resolve(targetDir);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 디렉토리를 찾을 수 없습니다: ${fullPath}`);
    process.exit(1);
  }

  console.log('🎨 CSS Module 자동 변환 시작...');
  console.log(`📁 대상: ${fullPath}\n`);

  const stats = processDirectory(fullPath);

  console.log('\n================================');
  console.log('✅ 변환 완료!');
  console.log(`   - CSS 파일: ${stats.css}개`);
  console.log(`   - TSX 파일: ${stats.tsx}개`);
  console.log(`   - 스킵: ${stats.skipped}개`);
  console.log('\n⚠️  다음 단계:');
  console.log('   1. 변환된 파일 검토');
  console.log('   2. 브라우저에서 동작 확인');
  console.log('   3. 문제 없으면 .backup 파일 삭제');
  console.log('   4. 기존 .css 파일 삭제 (선택)');
}

main();
