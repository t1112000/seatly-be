'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create booking_seats junction table
    await queryInterface.createTable('booking_seats', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'bookings',
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
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add index for better query performance
    await queryInterface.addIndex('booking_seats', ['booking_id']);
    await queryInterface.addIndex('booking_seats', ['seat_id']);
    await queryInterface.addIndex('booking_seats', ['booking_id', 'seat_id'], {
      unique: true,
    });

    // Migrate existing data from bookings to booking_seats
    await queryInterface.sequelize.query(`
      INSERT INTO booking_seats (id, booking_id, seat_id, price, created_at, updated_at)
      SELECT 
        gen_random_uuid(),
        b.id as booking_id,
        b.seat_id,
        s.price,
        b.created_at,
        b.updated_at
      FROM bookings b
      JOIN seats s ON s.id = b.seat_id
      WHERE b.seat_id IS NOT NULL
    `);

    // Remove seat_id column from bookings table
    await queryInterface.removeColumn('bookings', 'seat_id');
  },

  async down(queryInterface, Sequelize) {
    // Add seat_id column back to bookings table
    await queryInterface.addColumn('bookings', 'seat_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'seats',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    // Migrate data back (take the first seat from booking_seats)
    await queryInterface.sequelize.query(`
      UPDATE bookings b
      SET seat_id = (
        SELECT bs.seat_id
        FROM booking_seats bs
        WHERE bs.booking_id = b.id
        LIMIT 1
      )
    `);

    // Drop booking_seats table
    await queryInterface.dropTable('booking_seats');
  },
};

