const { onDocumentCreated } = require("firebase-functions/v2/firestore")
const sgMail = require("@sendgrid/mail")
const { initializeApp, getApps } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")
const { defineSecret } = require("firebase-functions/params")

// Inicializar solo si no está inicializado
if (getApps().length === 0) {
  initializeApp()
}

const db = getFirestore()

// Define el secret
const sendgridKey = defineSecret("SENDGRID_KEY")

exports.sendApplicationEmail = onDocumentCreated(
  {
    document: "applications/{applicationId}",
    secrets: [sendgridKey],
  },
  async (event) => {
    try {
      // Configurar SendGrid con el secret
      sgMail.setApiKey(sendgridKey.value())

      const application = event.data.data()

      // ✨ PASO 1: Verificar que tengamos el jobId
      if (!application.jobId) {
        console.error("❌ No se encontró jobId en la aplicación")
        return null
      }

      // ✨ PASO 2: Obtener el empleo para saber quién lo creó
      const jobDoc = await db.collection("jobs").doc(application.jobId).get()

      if (!jobDoc.exists) {
        console.error("❌ No se encontró el empleo con ID:", application.jobId)
        return null
      }

      const jobData = jobDoc.data()
      const createdByUid = jobData.createdBy

      if (!createdByUid) {
        console.error("❌ El empleo no tiene createdBy definido")
        return null
      }

      // ✨ PASO 3: Obtener el email del admin que creó el empleo
      const adminDoc = await db.collection("users").doc(createdByUid).get()

      if (!adminDoc.exists) {
        console.error(
          "❌ No se encontró el usuario admin con UID:",
          createdByUid
        )
        return null
      }

      const adminData = adminDoc.data()
      const adminEmail = adminData.email

      if (!adminEmail) {
        console.error("❌ El admin no tiene email configurado")
        return null
      }

      console.log("✅ Enviando correo al admin:", adminEmail)

      // ✨ PASO 4: Enviar el correo al admin correcto
      const msg = {
        to: adminEmail,
        from: "LCS Staffing <lcsstaffing.app@gmail.com>",
        subject: `Nueva postulación | LCS Staffing`,
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
            application.englishLevel || "No especificado"
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

      await sgMail.send(msg)
      console.log("✅ Email enviado exitosamente a:", adminEmail)
      return null
    } catch (error) {
      console.error("❌ Error en sendApplicationEmail:", error)
      if (error.response) {
        console.error("Detalles del error:", error.response.body)
      }
      throw error
    }
  }
)
