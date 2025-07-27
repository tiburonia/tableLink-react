
const { DataTypes } = require('sequelize');
const sequelize = require('../database');

// Store 모델
const Store = sequelize.define('Store', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  category: {
    type: DataTypes.STRING(100)
  },
  distance: {
    type: DataTypes.STRING(50)
  },
  menu: {
    type: DataTypes.JSONB
  },
  coord: {
    type: DataTypes.JSONB
  },
  review_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  is_open: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  reviews: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'stores',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// User 모델
const User = sequelize.define('User', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  pw: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(100)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING(255)
  },
  address: {
    type: DataTypes.STRING(500)
  },
  birth: {
    type: DataTypes.STRING(20)
  },
  gender: {
    type: DataTypes.STRING(10)
  },
  point: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  order_list: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  reservation_list: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  coupons: {
    type: DataTypes.JSONB,
    defaultValue: { unused: [], used: [] }
  },
  favorite_stores: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Cart 모델
const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  store_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  table_num: {
    type: DataTypes.STRING(10)
  },
  order_data: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  saved_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'carts',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'store_id']
    }
  ]
});

// StoreTable 모델
const StoreTable = sequelize.define('StoreTable', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  store_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Store,
      key: 'id'
    }
  },
  table_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  table_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  seats: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  is_occupied: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  occupied_since: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'store_tables',
  timestamps: false
});

// 모델 관계 설정
Store.hasMany(StoreTable, { foreignKey: 'store_id', as: 'tables' });
StoreTable.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

User.hasMany(Cart, { foreignKey: 'user_id', as: 'carts' });
Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Store.hasMany(Cart, { foreignKey: 'store_id', as: 'carts' });
Cart.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

module.exports = {
  sequelize,
  Store,
  User,
  Cart,
  StoreTable
};

