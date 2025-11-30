'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      seat_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'seats',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('PENDING_PAYMENT', 'PAID', 'FAILED', 'EXPIRED'),
        allowNull: false,
        defaultValue: 'PENDING_PAYMENT',
      },
      payment_provider: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      provider_session_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      provider_transaction_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      },
      expires_at: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('bookings', ['seat_id', 'status'], {
      name: 'bookings_seat_id_status_index',
    });
    await queryInterface.addIndex('bookings', ['expires_at'], {
      name: 'bookings_expires_at_index',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      'bookings',
      'bookings_seat_id_status_index',
    );
    await queryInterface.removeIndex('bookings', 'bookings_expires_at_index');
    await queryInterface.dropTable('bookings');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_bookings_status";',
    );
  },
};
