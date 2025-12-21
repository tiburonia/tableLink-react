import { PromotionCard } from "./PromotionCard"
import { TopUsersCard } from "./TopUsersCard"

export const RegularTab = ({ storeId }: { storeId: number }) => {
 return (
  <>
    <PromotionCard storeId={storeId}/>
    <TopUsersCard storeId={storeId} />
  </>
 )
}