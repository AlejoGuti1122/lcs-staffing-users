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

      // ✨ PASO 2: Obtener el empleo para saber quién lo maneja
      const jobDoc = await db.collection("jobs").doc(application.jobId).get()

      if (!jobDoc.exists) {
        console.error("❌ No se encontró el empleo con ID:", application.jobId)
        return null
      }

      const jobData = jobDoc.data()

      // 🔥 CAMBIO IMPORTANTE: Buscar accountManager primero, si no existe usar createdBy
      const accountManagerUid = jobData.accountManager || jobData.createdBy

      if (!accountManagerUid) {
        console.error(
          "❌ El empleo no tiene accountManager ni createdBy definido"
        )
        return null
      }

      console.log("📧 Account Manager UID:", accountManagerUid)

      // ✨ PASO 3: Obtener el email del Account Manager actual
      const adminDoc = await db.collection("users").doc(accountManagerUid).get()

      if (!adminDoc.exists) {
        console.error(
          "❌ No se encontró el usuario admin con UID:",
          accountManagerUid
        )
        return null
      }

      const adminData = adminDoc.data()
      const adminEmail = adminData.email

      if (!adminEmail) {
        console.error("❌ El Account Manager no tiene email configurado")
        return null
      }

      console.log("✅ Enviando correo al Account Manager:", adminEmail)
      console.log("✅ Enviando correo al candidato:", application.email)

      // ✨ CORREO 1: Al Account Manager actual
      const adminMsg = {
        to: adminEmail,
        from: "app@lcsstaffing.com",
        subject: `Nueva Postulación Recibida – ${application.jobTitle}`,
        html: `
          <h2>Nueva Postulación Recibida</h2>
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
            application.experienceLocation
              ? `<p><strong>Lugar de trabajo:</strong> ${application.experienceLocation}</p>`
              : ""
          }
          ${
            application.experienceTimePeriod
              ? `<p><strong>Período:</strong> ${application.experienceTimePeriod}</p>`
              : ""
          }
          ${
            application.additionalNotes
              ? `<p><strong>Notas:</strong> ${application.additionalNotes}</p>`
              : ""
          }
        `,
      }

      // ✨ CORREO 2: Al candidato (confirmación)
      const candidateMsg = {
        to: application.email,
        from: "app@lcsstaffing.com",
        subject: `Confirmación de Postulación – ${application.jobTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3b82f6;">¡Gracias por tu postulación!</h2>
            <p>Hola <strong>${application.fullName}</strong>,</p>
            <p>Hemos recibido tu postulación para el puesto de <strong>${
              application.jobTitle
            }</strong>.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Resumen de tu postulación:</h3>
              <p><strong>Puesto:</strong> ${application.jobTitle}</p>
              <p><strong>Fecha de postulación:</strong> ${new Date().toLocaleDateString(
                "es-ES"
              )}</p>
            </div>

            <p>Nuestro equipo revisará tu información y nos pondremos en contacto contigo pronto.</p>
            
            <p style="margin-top: 30px;">Saludos cordiales,<br>
            <strong>Equipo de LCS Staffing</strong></p>
            
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280;">
              Este es un correo automático, por favor no respondas a este mensaje.
            </p>
          </div>
        `,
      }

      // ✨ Enviar ambos correos
      await sgMail.send(adminMsg)
      console.log(
        "✅ Email enviado exitosamente al Account Manager:",
        adminEmail
      )

      await sgMail.send(candidateMsg)
      console.log(
        "✅ Email enviado exitosamente al candidato:",
        application.email
      )

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
