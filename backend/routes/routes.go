package routes

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"siak/backend/controllers"
	"siak/backend/middlewares"
)

func SetupRoutes(e *echo.Echo) {
	// Serve uploaded files (photos, payment proofs)
	e.Static("/uploads", "./uploads")

	// Public routes
	e.GET("/", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"message": "SiAK Backend API",
			"version": "2.0.0",
			"status":  "running",
		})
	})
	e.GET("/api/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "OK"})
	})

	api := e.Group("/api")

	// Authentication
	api.POST("/login", controllers.Login)
	api.POST("/public/ppdb/register", controllers.PublicRegisterPPDB)
	api.POST("/public/ppdb/upload", controllers.PublicUploadPPDBDocument)
	api.GET("/public/ppdb/status", controllers.PublicCheckPPDBStatus)
	api.GET("/public/site-config", controllers.PublicGetSiteConfig)
	api.GET("/public/cms/posts", controllers.PublicGetCMSPosts)
	api.GET("/public/cms/posts/:slug", controllers.PublicGetCMSPostBySlug)
	api.GET("/public/cms/navigation", controllers.PublicGetCMSNavigation)

	// Protected routes group
	protected := api.Group("")
	protected.Use(middlewares.JWTMiddleware())

	// Role groups
	adminLike := protected.Group("")
	adminLike.Use(middlewares.RequireRoles("admin", "kepala_sekolah"))

	teacherLike := protected.Group("")
	teacherLike.Use(middlewares.RequireRoles("admin", "kepala_sekolah", "guru"))

	studentLike := protected.Group("")
	studentLike.Use(middlewares.RequireRoles("admin", "kepala_sekolah", "guru", "siswa", "wali_murid"))

	// ── Dashboard ──────────────────────────────────────────────
	teacherLike.GET("/dashboard", controllers.GetDashboardStats)

	// ── Teacher routes ─────────────────────────────────────────
	adminLike.GET("/teachers", controllers.GetTeachers)
	adminLike.GET("/teachers/:id", controllers.GetTeacherByID)
	adminLike.POST("/teachers", controllers.CreateTeacher)
	adminLike.PUT("/teachers/:id", controllers.UpdateTeacher)
	adminLike.DELETE("/teachers/:id", controllers.DeleteTeacher)

	// ── Student routes ─────────────────────────────────────────
	adminLike.GET("/students", controllers.GetStudents)
	teacherLike.GET("/students/:id", controllers.GetStudentByID)
	adminLike.POST("/students", controllers.CreateStudent)
	teacherLike.PUT("/students/:id", controllers.UpdateStudent)
	adminLike.DELETE("/students/:id", controllers.DeleteStudent)

	// ── Upload routes ──────────────────────────────────────────
	adminLike.POST("/upload/photo", controllers.UploadPhoto)
	adminLike.POST("/upload/cms-image", controllers.UploadCMSImage)
	adminLike.GET("/upload/cms-images", controllers.GetCMSMediaLibrary)
	studentLike.POST("/upload/payment-proof", controllers.UploadPaymentProof)

	// ── SPP Settings routes ────────────────────────────────────
	teacherLike.GET("/spp/settings", controllers.GetSppSettings)
	teacherLike.POST("/spp/settings", controllers.CreateSppSetting)
	teacherLike.DELETE("/spp/settings/:id", controllers.DeleteSppSetting)

	// ── SPP Payment routes ─────────────────────────────────────
	teacherLike.GET("/spp/payments", controllers.GetSppPayments)
	teacherLike.GET("/spp/payments/stats", controllers.GetSppMonthlyStats)
	studentLike.GET("/spp/payments/:id", controllers.GetSppPaymentByID)
	teacherLike.POST("/spp/payments", controllers.CreateSppPayment)
	teacherLike.POST("/spp/payments/generate", controllers.GenerateSppBulk)
	studentLike.PUT("/spp/payments/:id", controllers.UpdateSppPayment)
	teacherLike.PUT("/spp/payments/:id/verify", controllers.VerifySppPayment)
	teacherLike.DELETE("/spp/payments/:id", controllers.DeleteSppPayment)

	// ── SPP History per student ────────────────────────────────
	studentLike.GET("/spp/student/:student_id", controllers.GetStudentSppHistory)

	// ── Class routes ───────────────────────────────────────────
	teacherLike.GET("/classes", controllers.GetClasses)
	teacherLike.GET("/classes/:id", controllers.GetClassByID)
	adminLike.POST("/classes", controllers.CreateClass)
	adminLike.PUT("/classes/:id", controllers.UpdateClass)
	adminLike.DELETE("/classes/:id", controllers.DeleteClass)
	teacherLike.GET("/classes/:id/students", controllers.GetClassStudents)
	adminLike.POST("/classes/:id/assign-students", controllers.AssignStudentsToClass)
	adminLike.POST("/classes/remove-student/:student_id", controllers.RemoveStudentFromClass)

	// ── User Management routes ─────────────────────────────────
	adminLike.GET("/users", controllers.GetUsers)
	adminLike.PUT("/users/:id/role", controllers.UpdateUserRole)
	adminLike.PUT("/users/:id/status", controllers.UpdateUserStatus)
	adminLike.PUT("/users/:id/password", controllers.UpdateUserPassword)

	// ── CMS Internal routes ────────────────────────────────────
	adminLike.GET("/site-config", controllers.GetSiteConfig)
	adminLike.PUT("/site-config", controllers.UpdateSiteConfig)
	adminLike.GET("/cms/posts", controllers.GetCMSPosts)
	adminLike.POST("/cms/posts", controllers.CreateCMSPost)
	adminLike.PUT("/cms/posts/:id", controllers.UpdateCMSPost)
	adminLike.DELETE("/cms/posts/:id", controllers.DeleteCMSPost)
	adminLike.GET("/cms/navigation", controllers.GetCMSNavigationItems)
	adminLike.POST("/cms/navigation", controllers.CreateCMSNavigationItem)
	adminLike.PUT("/cms/navigation/:id", controllers.UpdateCMSNavigationItem)
	adminLike.DELETE("/cms/navigation/:id", controllers.DeleteCMSNavigationItem)

	// ── PPDB Internal routes ───────────────────────────────────
	adminLike.GET("/ppdb/applications", controllers.GetPPDBApplications)
	adminLike.GET("/ppdb/applications/:id", controllers.GetPPDBApplicationByID)
	adminLike.POST("/ppdb/applications", controllers.CreatePPDBApplication)
	adminLike.PUT("/ppdb/applications/:id", controllers.UpdatePPDBApplication)
	adminLike.PUT("/ppdb/applications/:id/status", controllers.UpdatePPDBStatus)
	adminLike.POST("/ppdb/applications/:id/convert", controllers.ConvertPPDBToStudent)
}
