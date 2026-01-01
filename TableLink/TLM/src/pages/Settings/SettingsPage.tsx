import styles from './SettingsPage.module.css'

export function SettingsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>설정</h1>
        <p>시스템 설정을 관리하세요</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>일반 설정</h2>
          <div className={styles.settingItem}>
            <div>
              <span className={styles.settingLabel}>서비스 이름</span>
              <span className={styles.settingDesc}>관리자 페이지에 표시되는 서비스명</span>
            </div>
            <input type="text" defaultValue="TableLink" className={styles.input} />
          </div>
          <div className={styles.settingItem}>
            <div>
              <span className={styles.settingLabel}>관리자 이메일</span>
              <span className={styles.settingDesc}>시스템 알림을 받을 이메일 주소</span>
            </div>
            <input type="email" defaultValue="admin@tablelink.com" className={styles.input} />
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>알림 설정</h2>
          <div className={styles.settingItem}>
            <div>
              <span className={styles.settingLabel}>새 매장 가입 알림</span>
              <span className={styles.settingDesc}>새로운 매장이 가입하면 알림 받기</span>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" defaultChecked />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.settingItem}>
            <div>
              <span className={styles.settingLabel}>리뷰 신고 알림</span>
              <span className={styles.settingDesc}>리뷰가 신고되면 알림 받기</span>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" defaultChecked />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.settingItem}>
            <div>
              <span className={styles.settingLabel}>주문 취소 알림</span>
              <span className={styles.settingDesc}>주문이 취소되면 알림 받기</span>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>보안 설정</h2>
          <div className={styles.settingItem}>
            <div>
              <span className={styles.settingLabel}>2단계 인증</span>
              <span className={styles.settingDesc}>로그인 시 추가 인증 필요</span>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" />
              <span className={styles.slider}></span>
            </label>
          </div>
          <button className={styles.button}>비밀번호 변경</button>
        </div>
      </div>
    </div>
  )
}
