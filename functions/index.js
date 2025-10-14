const { onDocumentCreated } = require("firebase-functions/v2/firestore")
const sgMail = require("@sendgrid/mail")
const { initializeApp } = require("firebase-admin/app")
const { defineSecret } = require("firebase-functions/params")

initializeApp()

// Define el secret
const sendgridKey = defineSecret("SENDGRID_KEY")

exports.sendApplicationEmail = onDocumentCreated(
  {
    document: "applications/{applicationId}",
    secrets: [sendgridKey], // ⚠️ MUY IMPORTANTE: declarar el secret aquí
  },
  async (event) => {
    // Configurar SendGrid con el secret
    sgMail.setApiKey(sendgridKey.value())

    const application = event.data.data()

    const msg = {
      to: "c.gutierrez.d.alejandro@gmail.com",
      from: "c.gutierrez.d.alejandro@gmail.com", // Debe estar verificado en SendGrid
      subject: `Nueva aplicación: ${application.jobTitle}`,
      html: `
        <h2>Nueva Aplicación Recibida</h2>
        <p><strong>Empleo:</strong> ${application.jobTitle}</p>
        <p><strong>Candidato:</strong> ${application.fullName}</p>
        <p><strong>Email:</strong> ${application.email}</p>
        <p><strong>Teléfono:</strong> ${application.phone}</p>
        <p><strong>Fecha de nacimiento:</strong> ${application.birthDate}</p>
        <p><strong>Dirección:</strong> ${application.address}</p>
        <hr>
        <p><strong>Transporte:</strong> ${application.hasTransport}</p>
        <p><strong>Documentos:</strong> ${application.hasDocuments}</p>
        <p><strong>Nivel de inglés:</strong> ${
          application.englishLevel?.join(", ") || "No especificado"
        }</p>
        <p><strong>Experiencia:</strong> ${application.hasExperience}</p>
        ${
          application.experienceDetails
            ? `<p><strong>Detalles:</strong> ${application.experienceDetails}</p>`
            : ""
        }
        ${
          application.workExperience?.length > 0
            ? `<p><strong>Experiencia laboral:</strong> ${application.workExperience.join(
                ", "
              )}</p>`
            : ""
        }
        ${
          application.additionalNotes
            ? `<p><strong>Notas:</strong> ${application.additionalNotes}</p>`
            : ""
        }
      `,
    }

    try {
      await sgMail.send(msg)
      console.log("✅ Email enviado exitosamente")
      return null
    } catch (error) {
      console.error("❌ Error enviando email:", error)
      if (error.response) {
        console.error("Detalles del error:", error.response.body)
      }
      throw error
    }
  }
)
