// Main application configuration
// This file can be used to configure app-wide settings

const config = {
  api: {
    version: process.env.API_VERSION || 'v1',
    prefix: `/api/${process.env.API_VERSION || 'v1'}`,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  delivery: {
    defaultRadius: 3, // km
    maxRadius: 5, // km
  },
  exception: {
    regularUserQuota: {
      period: '3weeks',
      count: 1,
    },
    vipUserQuota: {
      unlimited: true,
    },
  },
};

module.exports = config;


