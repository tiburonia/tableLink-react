// 내 리뷰 전체보기 렌더링 함수
async function renderMyReviews(userInfo) {
  const userId = userInfo.id;
  const reviewsContainer = document.getElementById("reviews-container");
  reviewsContainer.innerHTML = ""; // 이전 리뷰 내용 초기화

  try {
    const response = await fetch(`/api/users/${userId}/reviews`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const reviews = await response.json();

    if (reviews.length === 0) {
      reviewsContainer.innerHTML = "<p>아직 작성한 리뷰가 없습니다.</p>";
      return;
    }

    reviews.forEach((review) => {
      const reviewElement = document.createElement("div");
      reviewElement.classList.add("review");
      reviewElement.innerHTML = `
        <h3>${review.productName}</h3>
        <p><strong>평점:</strong> ${review.rating}</p>
        <p>${review.comment}</p>
        <small>작성일: ${new Date(review.createdAt).toLocaleDateString()}</small>
      `;
      reviewsContainer.appendChild(reviewElement);
    });
  } catch (error) {
    console.error("리뷰를 불러오는 중 오류가 발생했습니다:", error);
    reviewsContainer.innerHTML = `
      <p>리뷰를 불러오는 데 실패했습니다.</p>
      <button class="primary-btn" onclick="renderMyReviews(userInfo)">
        <span class="btn-icon">🔄</span>
        다시 시도
      </button>
    `;
  }
}

// 전역으로 함수 노출
window.renderMyReviews = renderMyReviews;