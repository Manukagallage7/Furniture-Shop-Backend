import express from "express"
import { submitContact, getAllContacts, deleteContact, replyContact,updateContact } from "../controllers/contactController.js"

const contactRouter = express.Router()

contactRouter.post("/submit", submitContact)
contactRouter.get("/all", getAllContacts)
contactRouter.delete("/delete/:id", deleteContact)
contactRouter.post("/inquiries/:id/reply", replyContact)
contactRouter.put("/inquiries/:email", updateContact)

export default contactRouter
