interface StoreHeroProps {
  name: string
  category?: string | null
  region?: {
    sido?: string
    sigungu?: string
    eupmyeondong?: string
  } | null
}

export const StoreHero = ({ name, category, region }: StoreHeroProps) => {
  return (
    <div className="store-hero">
      <div className="store-hero-bg"></div>
      <div className="store-hero-overlay"></div>
      <div className="store-hero-info">
        {region && (
          <div className="store-breadcrumb">
            <span className="breadcrumb-item">{region.sido || '서울'}</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-item">{region.sigungu || region.eupmyeondong || '강남구'}</span>
            {category && (
              <>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-item">{category}</span>
              </>
            )}
          </div>
        )}
        <h2 className="store-name">{name}</h2>
      </div>
    </div>
  )
}
