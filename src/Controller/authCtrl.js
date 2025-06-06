const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const User = require('../Model/userModel');

const authCtrl = {
  signup: async (req, res) => {
    try {
      const { username, surname, email, password } = req.body;

      if (!username || !surname || !email || !password) {
        return res.status(400).json({ message: "Barcha qatorlarni to‘ldiring" });
      }

      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(403).json({ message: "Bu email allaqachon mavjud" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser = new User({
        username,
        surname,
        email,
        password: hashedPassword,
      });

      await newUser.save();

      const { password: _, ...userData } = newUser._doc;

      const token = JWT.sign(
        { id: newUser._id, role: newUser.role },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '12h' }
      );

      res.status(201).json({
        message: "Ro‘yxatdan o‘tish muvaffaqiyatli",
        userId: newUser._id.toString(), // Frontend uchun userId qo‘shildi
        token,
        user: userData
      });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Hamma qatorlarni to‘ldiring" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "Email topilmadi" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Parol noto‘g‘ri" });
      }

      const { password: _, ...userData } = user._doc;

      const token = JWT.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '12h' }
      );

      res.status(200).json({
        message: "Login muvaffaqiyatli",
        userId: user._id.toString(), // Frontend uchun userId qo‘shildi
        token,
        user: userData
      });

    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = authCtrl;