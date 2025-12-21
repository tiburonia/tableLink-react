interface StoreHeroProps {
  name: string
  category?: string | null
  region?: {
    sido?: string
    sigungu?: string
    eupmyeondong?: string
  } | null
  image?: string
}

export const StoreHero = ({ name, category, region, image }: StoreHeroProps) => {
  return (
    <div className="store-hero">
      <div className="img-wrapper">
        <img 
          src={'https://postfiles.pstatic.net/MjAyMzExMDJfMjEw/MDAxNjk4ODk5Nzc1OTEw.PXJ58KOpSo85IcyT40R-DkuyAYyqd_3e_7PSCLkd16gg.YwvgyvIFfAbHmPvlmOHtIjyK3Ec642xF2q7VjQ56cbkg.JPEG.wjseo0529/KakaoTalk_20231023_131607151.jpg?type=w386'} 
          alt={name}
          className="store-hero-image"
        />
        <div className="header-overlay"></div>
      </div>
    </div>
  )
}
