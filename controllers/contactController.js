import ContactModel from "../models/contactModel.js"
import { sendReplyEmail } from "../utils/emailService.js"

export async function submitContact(req, res) {
    const { fullName, email, phone, subject, message } = req.body

    if(!fullName || !email || !phone || !subject || !message) {
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    try {
        const contact = new ContactModel({
            fullName,
            email,
            phone,
            subject,
            message
        })

        await contact.save()
        res.status(201).json({
            message: "Message submitted successfully",
            data: contact
        })
    } catch(err) {
        res.status(500).json({
            message: "Error submitting message",
            error: err.message
        })
    }
}

export async function getAllContacts(req, res) {
    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to View Contacts"
        })
    }

    if(req.user.role !== "admin") {
        return res.status(403).json({
            message: "Access Denied"
        })
    }

    try {
        const contacts = await ContactModel.find().sort({ createdAt: -1 })
        res.status(200).json({
            message: "Contacts retrieved successfully",
            data: contacts
        })
    } catch(err) {
        res.status(500).json({
            message: "Error retrieving contacts",
            error: err.message
        })
    }
}

export async function deleteContact(req, res) {
    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to Delete Contact"
        })
    }

    if(req.user.role !== "admin") {
        return res.status(403).json({
            message: "Access Denied"
        })
    }

    try {
        const contactId = req.params.id
        const deletedContact = await ContactModel.findByIdAndDelete(contactId)

        if(!deletedContact) {
            return res.status(404).json({
                message: "Contact not found"
            })
        }

        res.status(200).json({
            message: "Contact deleted successfully",
            data: deletedContact
        })
    } catch(err) {
        res.status(500).json({
            message: "Error deleting contact",
            error: err.message
        })
    }
}

export async function replyContact(req, res) {
    if(req.user == null) {
        return res.status(401).json({
            message: "Please Login to Reply"
        })
    }

    if(req.user.role !== "admin") {
        return res.status(403).json({
            message: "Access Denied"
        })
    }

    try {
        const contactId = req.params.id
        const { reply } = req.body

        if(!reply) {
            return res.status(400).json({
                message: "Reply text is required"
            })
        }

        const contact = await ContactModel.findByIdAndUpdate(
            contactId,
            { replied: true, replyText: reply },
            { new: true }
        )

        if(!contact) {
            return res.status(404).json({
                message: "Contact not found"
            })
        }

        await sendReplyEmail(contact.email, contact.fullName, contact.subject, reply)

        res.status(200).json({
            message: "Reply sent successfully",
            data: contact
        })
    } catch(err) {
        res.status(500).json({
            message: "Error sending reply",
            error: err.message
        })
    }
}

export async function updateContact(req, res) {
    if (!req.user) {
        return res.status(401).json({
            message: "Please Login First"
        })
    }

    if (req.user.role !== "admin") {
        return res.status(401).json({
            message: "You are not authorized to update contacts"
        })
    }

    try {
        const { email } = req.params
        const { status, notes } = req.body

        const updatedContact = await ContactModel.findOneAndUpdate(
            { email: email },
            { status: status},
            { new: true }
        )

        if (!updatedContact) {
            return res.status(404).json({
                message: "Contact not found"
            })
        }

        res.json({
            success: true,
            message: "Contact updated successfully",
            contact: updatedContact
        })
    } catch (err) {
        console.error("Error updating contact:", err)
        res.status(500).json({
            message: "Error updating contact",
            error: err.message
        })
    }
}
