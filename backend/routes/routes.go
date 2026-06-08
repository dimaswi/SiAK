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
	studentLike.GET("/dashboard", controllers.GetDashboardStats)

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

	// ── Billings & Payments routes ─────────────────────────────────────
	teacherLike.GET("/billings", controllers.GetBillings)
	teacherLike.GET("/billings/:id", controllers.GetBillingByID)
	teacherLike.POST("/billings", controllers.CreateBilling)
	teacherLike.DELETE("/billings/:id", controllers.DeleteBilling)
	teacherLike.GET("/transactions", controllers.GetTransactions)
	teacherLike.POST("/transactions", controllers.CreateTransaction)
	teacherLike.PUT("/transactions/:id/verify", controllers.VerifyTransaction)
	teacherLike.PUT("/billings/:id/pay-off", controllers.PayOffBilling)
	teacherLike.PUT("/billings/:id/discount", controllers.DiscountBilling)

	// Recurring Billings
	adminLike.GET("/recurring-billings", controllers.GetRecurringBillings)
	adminLike.POST("/recurring-billings", controllers.CreateRecurringBilling)
	adminLike.PUT("/recurring-billings/:id/toggle", controllers.ToggleRecurringBilling)
	adminLike.POST("/recurring-billings/:id/force-run", controllers.ForceRunRecurringBilling)
	adminLike.DELETE("/recurring-billings/:id", controllers.DeleteRecurringBilling)

	teacherLike.DELETE("/transactions/:id", controllers.DeleteTransaction)
	studentLike.GET("/billings/student", controllers.GetBillings) // Students can fetch their own billings by adding student_id in controller
	studentLike.GET("/billings/student/:id", controllers.GetBillingByID)
	studentLike.GET("/transactions/student", controllers.GetTransactions)
	studentLike.POST("/transactions/student", controllers.CreateTransaction)

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
