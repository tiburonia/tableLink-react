import { PromotionCard } from '@/features/store-promotion'
import { TopUsersCard } from '@/features/store-table'

export const RegularTab = ({ storeId }: { storeId: number }) => {
 return (
  <>
    <PromotionCard storeId={storeId}/>
    <TopUsersCard storeId={storeId} />
  </>
 )
}