import { StoreBasicInfo, LocationInfo, AmenitiesSection } from '@/features/store-info'

export const StoreInfoTab = ({ store }: { store: any }) => {
  return (
    <>
      <StoreBasicInfo 
        phone={store.phone} 
        address={store.address} 
        isOpen={store.is_open} 
      />
      <AmenitiesSection amenities={store.amenities} />
      <LocationInfo 
        address={store.address || '주소 정보 없음'} 
        lat={store.latitude} 
        lng={store.longitude} 
      />
    </>
  )
}