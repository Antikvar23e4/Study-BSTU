const express = require("express");
const path = require("path");
const sequelize = require("./db");

//Импорт моделей
const Faculty = require("./models/Faculty");
const Pulpit = require("./models/Pulpit");
const Teacher = require("./models/Teacher");
const Subject = require("./models/Subject");
const AuditoriumType = require("./models/AuditoriumType");
const Auditorium = require("./models/Auditorium");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Подключение файла для определения связей между моделями
try {
  require("./models/associations");
  console.log("Associations loaded successfully.");
} catch (error) {
  console.error("Error loading associations:", error);
}

// Проверка соединения с базой данных
sequelize
  .authenticate()
  .then(() => {
    console.log("Database connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "page.html"));
});

app.get("/api/faculties", async (req, res) => {
  try {
    const faculties = await Faculty.findAll();
    res.json(faculties);
  } catch (err) {
    console.error("Error fetching faculties:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch faculties", details: err.message });
  }
});

app.get("/api/pulpits", async (req, res) => {
  try {
    const pulpits = await Pulpit.findAll({
      include: [{ model: Faculty, attributes: ["FACULTY_NAME"] }],
    });
    res.json(pulpits);
  } catch (err) {
    console.error("Error fetching pulpits:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch pulpits", details: err.message });
  }
});

app.get("/api/subjects", async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      include: [{ model: Pulpit, attributes: ["PULPIT_NAME", "FACULTY"] }],
    });
    res.json(subjects);
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch subjects", details: err.message });
  }
});

app.get("/api/auditoriumstypes", async (req, res) => {
  try {
    const types = await AuditoriumType.findAll();
    res.json(types);
  } catch (err) {
    console.error("Error fetching auditorium types:", err);
    res.status(500).json({
      error: "Failed to fetch auditorium types",
      details: err.message,
    });
  }
});

app.get("/api/auditoriums", async (req, res) => {
  try {
    const auditoriums = await Auditorium.findAll({
      include: [{ model: AuditoriumType, attributes: ["AUDITORIUM_TYPENAME"] }],
    });
    res.json(auditoriums);
  } catch (err) {
    console.error("Error fetching auditoriums:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch auditoriums", details: err.message });
  }
});

app.post("/api/faculties", async (req, res) => {
  try {
    const { FACULTY, FACULTY_NAME } = req.body;
    if (!FACULTY) {
      return res.status(400).json({ error: "FACULTY code is required" });
    }
    const newFaculty = await Faculty.create({ FACULTY, FACULTY_NAME });
    res.status(201).json(newFaculty);
  } catch (err) {
    console.error("Error creating faculty:", err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Faculty with this code already exists",
        details: err.message,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to create faculty", details: err.message });
  }
});

app.post("/api/pulpits", async (req, res) => {
  try {
    const { PULPIT, PULPIT_NAME, FACULTY } = req.body;
    if (!PULPIT) {
      return res.status(400).json({ error: "PULPIT code is required" });
    }
    if (FACULTY) {
      const facultyExists = await Faculty.findByPk(FACULTY);
      if (!facultyExists) {
        return res
          .status(404)
          .json({ error: `Faculty with code ${FACULTY} not found` });
      }
    }

    const newPulpit = await Pulpit.create({ PULPIT, PULPIT_NAME, FACULTY });
    res.status(201).json(newPulpit);
  } catch (err) {
    console.error("Error creating pulpit:", err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Pulpit with this code already exists",
        details: err.message,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to create pulpit", details: err.message });
  }
});

app.post("/api/subjects", async (req, res) => {
  try {
    const { SUBJECT, SUBJECT_NAME, PULPIT } = req.body;
    if (!SUBJECT) {
      return res.status(400).json({ error: "SUBJECT code is required" });
    }
    if (PULPIT) {
      const pulpitExists = await Pulpit.findByPk(PULPIT);
      if (!pulpitExists) {
        return res
          .status(404)
          .json({ error: `Pulpit with code ${PULPIT} not found` });
      }
    } else {
      return res
        .status(400)
        .json({ error: "PULPIT code is required for a subject" });
    }

    const newSubject = await Subject.create({ SUBJECT, SUBJECT_NAME, PULPIT });
    res.status(201).json(newSubject);
  } catch (err) {
    console.error("Error creating subject:", err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Subject with this code already exists",
        details: err.message,
      });
    }
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(404).json({
        error: `Pulpit with code ${req.body.PULPIT} not found`,
        details: err.message,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to create subject", details: err.message });
  }
});

app.post("/api/auditoriumstypes", async (req, res) => {
  try {
    const { AUDITORIUM_TYPE, AUDITORIUM_TYPENAME } = req.body;
    if (!AUDITORIUM_TYPE) {
      return res
        .status(400)
        .json({ error: "AUDITORIUM_TYPE code is required" });
    }
    const newType = await AuditoriumType.create({
      AUDITORIUM_TYPE,
      AUDITORIUM_TYPENAME,
    });
    res.status(201).json(newType);
  } catch (err) {
    console.error("Error creating auditorium type:", err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Auditorium type with this code already exists",
        details: err.message,
      });
    }
    res.status(500).json({
      error: "Failed to create auditorium type",
      details: err.message,
    });
  }
});

app.post("/api/auditoriums", async (req, res) => {
  try {
    const {
      AUDITORIUM,
      AUDITORIUM_NAME,
      AUDITORIUM_CAPACITY,
      AUDITORIUM_TYPE,
    } = req.body;
    if (!AUDITORIUM) {
      return res.status(400).json({ error: "AUDITORIUM code is required" });
    }
    if (AUDITORIUM_TYPE) {
      const typeExists = await AuditoriumType.findByPk(AUDITORIUM_TYPE);
      if (!typeExists) {
        return res.status(404).json({
          error: `Auditorium type with code ${AUDITORIUM_TYPE} not found`,
        });
      }
    } else {
      return res
        .status(400)
        .json({ error: "AUDITORIUM_TYPE code is required for an auditorium" });
    }

    const newAuditorium = await Auditorium.create({
      AUDITORIUM,
      AUDITORIUM_NAME,
      AUDITORIUM_CAPACITY,
      AUDITORIUM_TYPE,
    });
    res.status(201).json(newAuditorium);
  } catch (err) {
    console.error("Error creating auditorium:", err);
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Auditorium with this code already exists",
        details: err.message,
      });
    }
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(404).json({
        error: `Auditorium type with code ${req.body.AUDITORIUM_TYPE} not found`,
        details: err.message,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to create auditorium", details: err.message });
  }
});

app.put("/api/faculties", async (req, res) => {
  try {
    const { FACULTY, FACULTY_NAME } = req.body;
    if (!FACULTY) {
      return res
        .status(400)
        .json({ error: "FACULTY code is required for update" });
    }
    const [updatedCount] = await Faculty.update(
      { FACULTY_NAME },
      {
        where: { FACULTY: FACULTY },
      }
    );
    if (updatedCount > 0) {
      const updatedFaculty = await Faculty.findByPk(FACULTY);
      res.json(updatedFaculty);
    } else {
      res.status(404).json({ error: `Faculty with code ${FACULTY} not found` });
    }
  } catch (err) {
    console.error("Error updating faculty:", err);
    res
      .status(500)
      .json({ error: "Failed to update faculty", details: err.message });
  }
});

app.put("/api/pulpits", async (req, res) => {
  try {
    const { PULPIT, PULPIT_NAME, FACULTY } = req.body;
    if (!PULPIT) {
      return res
        .status(400)
        .json({ error: "PULPIT code is required for update" });
    }

    if (FACULTY) {
      const facultyExists = await Faculty.findByPk(FACULTY);
      if (!facultyExists) {
        return res
          .status(404)
          .json({ error: `Faculty with code ${FACULTY} not found` });
      }
    }

    const [updatedCount] = await Pulpit.update(
      { PULPIT_NAME, FACULTY },
      {
        where: { PULPIT: PULPIT },
      }
    );

    if (updatedCount > 0) {
      const updatedPulpit = await Pulpit.findByPk(PULPIT, {
        include: [{ model: Faculty, attributes: ["FACULTY_NAME"] }],
      });
      res.json(updatedPulpit);
    } else {
      res.status(404).json({ error: `Pulpit with code ${PULPIT} not found` });
    }
  } catch (err) {
    console.error("Error updating pulpit:", err);
    res
      .status(500)
      .json({ error: "Failed to update pulpit", details: err.message });
  }
});

app.put("/api/subjects", async (req, res) => {
  try {
    const { SUBJECT, SUBJECT_NAME, PULPIT } = req.body;
    if (!SUBJECT) {
      return res
        .status(400)
        .json({ error: "SUBJECT code is required for update" });
    }
    if (PULPIT) {
      const pulpitExists = await Pulpit.findByPk(PULPIT);
      if (!pulpitExists) {
        return res
          .status(404)
          .json({ error: `Pulpit with code ${PULPIT} not found` });
      }
    } else {
      return res
        .status(400)
        .json({ error: "PULPIT code is required for a subject" });
    }

    const [updatedCount] = await Subject.update(
      { SUBJECT_NAME, PULPIT },
      {
        where: { SUBJECT: SUBJECT },
      }
    );

    if (updatedCount > 0) {
      const updatedSubject = await Subject.findByPk(SUBJECT, {
        include: [{ model: Pulpit, attributes: ["PULPIT_NAME", "FACULTY"] }],
      });
      res.json(updatedSubject);
    } else {
      res.status(404).json({ error: `Subject with code ${SUBJECT} not found` });
    }
  } catch (err) {
    console.error("Error updating subject:", err);
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(404).json({
        error: `Pulpit with code ${req.body.PULPIT} not found`,
        details: err.message,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to update subject", details: err.message });
  }
});

app.put("/api/auditoriumstypes", async (req, res) => {
  try {
    const { AUDITORIUM_TYPE, AUDITORIUM_TYPENAME } = req.body;
    if (!AUDITORIUM_TYPE) {
      return res
        .status(400)
        .json({ error: "AUDITORIUM_TYPE code is required for update" });
    }
    const [updatedCount] = await AuditoriumType.update(
      { AUDITORIUM_TYPENAME },
      {
        where: { AUDITORIUM_TYPE: AUDITORIUM_TYPE },
      }
    );
    if (updatedCount > 0) {
      const updatedType = await AuditoriumType.findByPk(AUDITORIUM_TYPE);
      res.json(updatedType);
    } else {
      res.status(404).json({
        error: `Auditorium type with code ${AUDITORIUM_TYPE} not found`,
      });
    }
  } catch (err) {
    console.error("Error updating auditorium type:", err);
    res.status(500).json({
      error: "Failed to update auditorium type",
      details: err.message,
    });
  }
});

app.put("/api/auditoriums", async (req, res) => {
  try {
    const {
      AUDITORIUM,
      AUDITORIUM_NAME,
      AUDITORIUM_CAPACITY,
      AUDITORIUM_TYPE,
    } = req.body;
    if (!AUDITORIUM) {
      return res.status(400).json({
        error: "AUDITORIUM code is required for update in request body",
      });
    }
    if (AUDITORIUM_TYPE) {
      const typeExists = await AuditoriumType.findByPk(AUDITORIUM_TYPE);
      if (!typeExists) {
        return res.status(404).json({
          error: `Auditorium type with code ${AUDITORIUM_TYPE} not found`,
        });
      }
    } else {
      return res
        .status(400)
        .json({ error: "AUDITORIUM_TYPE code is required for an auditorium" });
    }

    const [updatedCount] = await Auditorium.update(
      { AUDITORIUM_NAME, AUDITORIUM_CAPACITY, AUDITORIUM_TYPE },
      { where: { AUDITORIUM: AUDITORIUM } }
    );

    if (updatedCount > 0) {
      const updatedAuditorium = await Auditorium.findByPk(AUDITORIUM, {
        include: [
          { model: AuditoriumType, attributes: ["AUDITORIUM_TYPENAME"] },
        ],
      });
      res.json(updatedAuditorium);
    } else {
      res
        .status(404)
        .json({ error: `Auditorium with code ${AUDITORIUM} not found` });
    }
  } catch (err) {
    console.error("Error updating auditorium:", err);
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(404).json({
        error: `Auditorium type with code ${req.body.AUDITORIUM_TYPE} not found`,
        details: err.message,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to update auditorium", details: err.message });
  }
});

app.delete("/api/faculties/:xyz", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const facultyCode = req.params.xyz;

    await Pulpit.update(
      { FACULTY: null },
      { where: { FACULTY: facultyCode }, transaction }
    );

    const deletedCount = await Faculty.destroy({
      where: { FACULTY: facultyCode },
      transaction,
    });

    if (deletedCount > 0) {
      await transaction.commit();
      res.json({
        message: `Faculty ${facultyCode} deleted successfully`,
        deletedCode: facultyCode,
      });
    } else {
      await transaction.rollback();
      res
        .status(404)
        .json({ error: `Faculty with code ${facultyCode} not found` });
    }
  } catch (err) {
    await transaction.rollback();
    console.error("Error deleting faculty:", err);
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(409).json({
        error: "Cannot delete faculty because related pulpits exist",
        details: err.message,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to delete faculty", details: err.message });
  }
});

app.delete("/api/pulpits/:xyz", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const pulpitCode = req.params.xyz;

    await Teacher.update(
      { PULPIT: null },
      { where: { PULPIT: pulpitCode }, transaction }
    );
    await Subject.update(
      { PULPIT: null },
      { where: { PULPIT: pulpitCode }, transaction }
    );

    const deletedCount = await Pulpit.destroy({
      where: { PULPIT: pulpitCode },
      transaction,
    });

    if (deletedCount > 0) {
      await transaction.commit();
      res.json({
        message: `Pulpit ${pulpitCode} deleted successfully`,
        deletedCode: pulpitCode,
      });
    } else {
      await transaction.rollback();
      res
        .status(404)
        .json({ error: `Pulpit with code ${pulpitCode} not found` });
    }
  } catch (err) {
    await transaction.rollback();
    console.error("Error deleting pulpit:", err);
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(409).json({
        error: "Cannot delete pulpit due to existing dependencies",
        details: err.message,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to delete pulpit", details: err.message });
  }
});

app.delete("/api/subjects/:xyz", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const subjectCode = req.params.xyz;
    const deletedCount = await Subject.destroy({
      where: { SUBJECT: subjectCode },
      transaction,
    });

    if (deletedCount > 0) {
      await transaction.commit();
      res.json({
        message: `Subject ${subjectCode} deleted successfully`,
        deletedCode: subjectCode,
      });
    } else {
      await transaction.rollback();
      res
        .status(404)
        .json({ error: `Subject with code ${subjectCode} not found` });
    }
  } catch (err) {
    await transaction.rollback();
    console.error("Error deleting subject:", err);
    res
      .status(500)
      .json({ error: "Failed to delete subject", details: err.message });
  }
});

app.delete("/api/auditoriumstypes/:xyz", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const typeCode = req.params.xyz;

    await Auditorium.update(
      { AUDITORIUM_TYPE: null },
      { where: { AUDITORIUM_TYPE: typeCode }, transaction }
    );

    const deletedCount = await AuditoriumType.destroy({
      where: { AUDITORIUM_TYPE: typeCode },
      transaction,
    });

    if (deletedCount > 0) {
      await transaction.commit();
      res.json({
        message: `Auditorium type ${typeCode} deleted successfully`,
        deletedCode: typeCode,
      });
    } else {
      await transaction.rollback();
      res
        .status(404)
        .json({ error: `Auditorium type with code ${typeCode} not found` });
    }
  } catch (err) {
    await transaction.rollback();
    console.error("Error deleting auditorium type:", err);
    res.status(500).json({
      error: "Failed to delete auditorium type",
      details: err.message,
    });
  }
});

app.delete("/api/auditoriums/:xyz", async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const auditoriumCode = req.params.xyz;
    const deletedCount = await Auditorium.destroy({
      where: { AUDITORIUM: auditoriumCode },
      transaction,
    });

    if (deletedCount > 0) {
      await transaction.commit();
      res.json({
        message: `Auditorium ${auditoriumCode} deleted successfully`,
        deletedCode: auditoriumCode,
      });
    } else {
      await transaction.rollback();
      res
        .status(404)
        .json({ error: `Auditorium with code ${auditoriumCode} not found` });
    }
  } catch (err) {
    await transaction.rollback();
    console.error("Error deleting auditorium:", err);
    res
      .status(500)
      .json({ error: "Failed to delete auditorium", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
