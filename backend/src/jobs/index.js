const { startRestaurantReviewJob } = require('./restaurantReviewJob');

const startJobs = () => {
  startRestaurantReviewJob();
};

module.exports = { startJobs };

