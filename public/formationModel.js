import mongoose from "mongoose";

const formationSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  duree: { type: String, required: true },
  resume: { type: String, required: true },
  contenu: { type: String, required: true },
  image: { type: String }
});

const Formation = mongoose.model("Formation", formationSchema);
export default Formation;
