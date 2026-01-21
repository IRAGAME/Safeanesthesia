import mongoose from "mongoose";

const formationSchema = new mongoose.Schema({
  titre: { type: String, required: true },
  duree: { type: String, required: true },
  resume: String,
  contenu: String,
  image: String,
  vues: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  commentaires: { type: Number, default: 0 }
});

export default mongoose.model("Formation", formationSchema);
