import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import  getNamaBulan  from "../utils/bulanName.js";

console.log('[AUTH CONTROLLER] Loaded\n');

export const register = async (req, res) => {
  try {
    console.log('[REGISTER] Request received');
    const { name, email, password, role } = req.body;
    console.log(`[REGISTER] Input: name=${name}, email=${email}, role=${role || 'petugas'}`);

    // validasi sederhana
    if (!name || !email || !password) {
      console.log('[REGISTER] ✗ Validation FAILED: Missing required fields');
      return res.status(400).json({
        message: "Semua field wajib diisi",
      });
    }
    console.log('[REGISTER] ✓ Validation passed');

    // cek email sudah ada
    console.log('[REGISTER] Checking if email already exists...');
    const [checkUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (checkUser.length > 0) {
      console.log(`[REGISTER] ✗ Email already exists: ${email}`);
      return res.status(400).json({
        message: "Email sudah terdaftar",
      });
    }
    console.log(`[REGISTER] ✓ Email available: ${email}`);

    // hash password
    console.log('[REGISTER] Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('[REGISTER] ✓ Password hashed successfully');

    // insert user
    console.log('[REGISTER] Inserting user into database...');
    await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)`,
      [name, email, hashedPassword, role || "petugas"]
    );
    console.log(`[REGISTER] ✓ User created successfully\n`);

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil",
    });

  } catch (error) {
    console.log(`[REGISTER] ✗ Server error: ${error.message}\n`);
    res.status(500).json({
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    console.log('[LOGIN] Request received');
    const { email, password } = req.body;
    console.log(`[LOGIN] Input: email=${email}`);

    console.log('[LOGIN] Querying user from database...');
    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      console.log(`[LOGIN] ✗ User NOT found: ${email}`);
      return res.status(400).json({
        message: "Email tidak ditemukan",
      });
    }
    console.log(`[LOGIN] ✓ User found in database: ${email}`);

    const user = users[0];

    console.log('[LOGIN] Comparing password...');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`[LOGIN] ✗ Password MISMATCH for user: ${email}`);
      return res.status(400).json({
        message: "Password salah",
      });
    }
    console.log(`[LOGIN] ✓ Password matched for user: ${email}`);

    // buat token
    console.log('[LOGIN] Generating JWT token...');
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log(`[LOGIN] ✓ JWT token generated - expires: 7d`);
    console.log(`[LOGIN] ✓ Login successful - User: ${user.name} (ID: ${user.id})\n`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.log(`[LOGIN] ✗ Server error: ${error.message}\n`);
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getUsers = async (req, res) => {
  const connection = await db.getConnection();

  try {

    const [users] = await connection.query(
      `SELECT 
          id,
          name,
          email,
          role,
          created_at,
          updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      total_data: users.length,
      data: users
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  } finally {
    connection.release();
  }
};

export const getUserById = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

    const [[user]] = await connection.query(
      `SELECT 
          id,
          name,
          email,
          role,
          status,
          created_at,
          updated_at
       FROM users
       WHERE id=?`,
      [id]
    );

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    res.json({
      success: true,
      data: user
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  } finally {
    connection.release();
  }
};


export const updateUser = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    // cek user ada atau tidak
    const [[existingUser]] = await connection.query(
      `SELECT * FROM users WHERE id=?`,
      [id]
    );

    if (!existingUser) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    let hashedPassword = existingUser.password;

    // jika password diisi, hash ulang
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    await connection.query(
      `UPDATE users
       SET name=?,
           email=?,
           role=?,
           password=?,
           updated_at=NOW()
       WHERE id=?`,
      [
        name || existingUser.name,
        email || existingUser.email,
        role || existingUser.role,
        hashedPassword,
        id
      ]
    );

    res.json({
      success: true,
      message: "User berhasil diupdate"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  } finally {
    connection.release();
  }
};

export const deleteUser = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

    const [[existingUser]] = await connection.query(
      `SELECT * FROM users WHERE id=?`,
      [id]
    );

    if (!existingUser) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    await connection.query(
      `DELETE FROM users WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "User berhasil dihapus"
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  } finally {
    connection.release();
  }
};

export const profile = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const userId = req.params.id;

    // ==========================
    // USER
    // ==========================
    const [[user]] = await connection.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        created_at
      FROM users
      WHERE id=?
      `,
      [userId]
    );

    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan"
      });
    }

    // ==========================
    // RINGKASAN
    // ==========================
    const [[ringkasan]] = await connection.query(
      `
      SELECT
        COUNT(p.id) as total_pencatatan,

        COUNT(DISTINCT p.pelanggan_id)
          as total_pelanggan_unik,

        COALESCE(SUM(p.pemakaian),0)
          as total_pemakaian,

        COALESCE(SUM(t.total_tagihan),0)
          as total_tagihan

      FROM pencatatan_meter p
      LEFT JOIN tagihan t
        ON t.pencatatan_id=p.id

      WHERE p.dicatat_oleh=?
      `,
      [userId]
    );

    // ==========================
    // REKAP BULANAN
    // ==========================
    const [rekapBulanan] = await connection.query(
      `
      SELECT
        p.tahun,
        p.bulan,

        COUNT(p.id)
          as jumlah_pencatatan,

        COUNT(DISTINCT p.pelanggan_id)
          as jumlah_pelanggan,

        COALESCE(SUM(p.pemakaian),0)
          as total_pemakaian,

        COALESCE(SUM(t.total_tagihan),0)
          as total_tagihan

      FROM pencatatan_meter p
      LEFT JOIN tagihan t
        ON t.pencatatan_id=p.id

      WHERE p.dicatat_oleh=?

      GROUP BY p.tahun,p.bulan

      ORDER BY p.tahun DESC,p.bulan DESC
      `,
      [userId]
    );

    // ==========================
    // FORMAT REKAP
    // ==========================
    const dataBulanan = rekapBulanan.map((item) => ({
      tahun: item.tahun,
      bulan: item.bulan,

      jumlah_pencatatan:
        Number(item.jumlah_pencatatan) || 0,

      jumlah_pelanggan:
        Number(item.jumlah_pelanggan) || 0,

      total_pemakaian:
        Number(item.total_pemakaian) || 0,

      total_tagihan:
        Number(item.total_tagihan) || 0
    }));

    // ==========================
    // RESPONSE
    // ==========================
    res.json({
      success: true,

      user,

      ringkasan: {
        total_pencatatan:
          Number(ringkasan.total_pencatatan) || 0,

        total_pelanggan_unik:
          Number(ringkasan.total_pelanggan_unik) || 0,

        total_pemakaian:
          Number(ringkasan.total_pemakaian) || 0,

        total_tagihan:
          Number(ringkasan.total_tagihan) || 0
      },

      rekap_per_bulan: dataBulanan
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  } finally {
    connection.release();
  }
};