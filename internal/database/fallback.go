package database

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"code-execution-engine/internal/models"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// In-memory storage as fallback
type InMemoryDB struct {
	users    map[string]*models.User
	sessions map[string]*models.UserSession
	shares   map[string]*models.CodeShare
	projects map[string]*models.Project
	mutex    sync.RWMutex
}

var (
	inMemoryDB  *InMemoryDB
	useInMemory bool = false
)

func init() {
	inMemoryDB = &InMemoryDB{
		users:    make(map[string]*models.User),
		sessions: make(map[string]*models.UserSession),
		shares:   make(map[string]*models.CodeShare),
		projects: make(map[string]*models.Project),
	}
}

// ConnectDatabase tries MongoDB first, falls back to in-memory
func ConnectDatabase() error {
	// Try MongoDB first
	err := ConnectMongoDB()
	if err != nil {
		log.Printf("⚠️  MongoDB connection failed: %v", err)
		log.Println("🔄 Falling back to in-memory database for development")
		useInMemory = true
		return nil
	}

	log.Println("✅ Connected to MongoDB Atlas")
	useInMemory = false
	return nil
}

// User operations with fallback
func CreateUser(user *models.User) error {
	if useInMemory {
		return createUserInMemory(user)
	}
	return createUserMongoDB(user)
}

func GetUserByGoogleID(googleID string) (*models.User, error) {
	if useInMemory {
		return getUserByGoogleIDInMemory(googleID)
	}
	return getUserByGoogleIDMongoDB(googleID)
}

func UpdateUser(user *models.User) error {
	if useInMemory {
		return updateUserInMemory(user)
	}
	return updateUserMongoDB(user)
}

func GetUserByID(userID string) (*models.User, error) {
	if useInMemory {
		return getUserByIDInMemory(userID)
	}
	return getUserByIDMongoDB(userID)
}

// In-memory implementations
func createUserInMemory(user *models.User) error {
	inMemoryDB.mutex.Lock()
	defer inMemoryDB.mutex.Unlock()

	if user.ID.IsZero() {
		user.ID = primitive.NewObjectID()
	}

	inMemoryDB.users[user.ID.Hex()] = user
	log.Printf("📝 Created user in memory: %s (%s)", user.Name, user.Email)
	return nil
}

func getUserByGoogleIDInMemory(googleID string) (*models.User, error) {
	inMemoryDB.mutex.RLock()
	defer inMemoryDB.mutex.RUnlock()

	for _, user := range inMemoryDB.users {
		if user.GoogleID == googleID {
			return user, nil
		}
	}
	return nil, fmt.Errorf("user not found")
}

func updateUserInMemory(user *models.User) error {
	inMemoryDB.mutex.Lock()
	defer inMemoryDB.mutex.Unlock()

	user.UpdatedAt = time.Now()
	inMemoryDB.users[user.ID.Hex()] = user
	return nil
}

func getUserByIDInMemory(userID string) (*models.User, error) {
	inMemoryDB.mutex.RLock()
	defer inMemoryDB.mutex.RUnlock()

	user, exists := inMemoryDB.users[userID]
	if !exists {
		return nil, fmt.Errorf("user not found")
	}
	return user, nil
}

// MongoDB implementations
func createUserMongoDB(user *models.User) error {
	collection := UsersCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if user.ID.IsZero() {
		user.ID = primitive.NewObjectID()
	}

	_, err := collection.InsertOne(ctx, user)
	return err
}

func getUserByGoogleIDMongoDB(googleID string) (*models.User, error) {
	collection := UsersCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var user models.User
	err := collection.FindOne(ctx, map[string]interface{}{"google_id": googleID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func updateUserMongoDB(user *models.User) error {
	collection := UsersCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	user.UpdatedAt = time.Now()
	_, err := collection.ReplaceOne(ctx, map[string]interface{}{"_id": user.ID}, user)
	return err
}

func getUserByIDMongoDB(userID string) (*models.User, error) {
	collection := UsersCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID: %v", err)
	}

	var user models.User
	err = collection.FindOne(ctx, map[string]interface{}{"_id": objectID}).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Session operations
func CreateSession(session *models.UserSession) error {
	if useInMemory {
		inMemoryDB.mutex.Lock()
		defer inMemoryDB.mutex.Unlock()

		if session.ID.IsZero() {
			session.ID = primitive.NewObjectID()
		}

		inMemoryDB.sessions[session.ID.Hex()] = session
		return nil
	}

	// MongoDB implementation
	collection := SessionsCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if session.ID.IsZero() {
		session.ID = primitive.NewObjectID()
	}

	_, err := collection.InsertOne(ctx, session)
	return err
}

// Share operations with fallback
func CreateShare(share *models.CodeShare) error {
	if useInMemory {
		return createShareInMemory(share)
	}
	return createShareMongoDB(share)
}

func GetShareByID(shareID string) (*models.CodeShare, error) {
	if useInMemory {
		return getShareByIDInMemory(shareID)
	}
	return getShareByIDMongoDB(shareID)
}

func GetUserShares(userID string, page, limit int) ([]models.CodeShare, int64, error) {
	if useInMemory {
		return getUserSharesInMemory(userID, page, limit)
	}
	return getUserSharesMongoDB(userID, page, limit)
}

func UpdateShareViewCount(shareID string) error {
	if useInMemory {
		return updateShareViewCountInMemory(shareID)
	}
	return updateShareViewCountMongoDB(shareID)
}

// Project operations with fallback
func CreateProject(project *models.Project) error {
	if useInMemory {
		return createProjectInMemory(project)
	}
	return createProjectMongoDB(project)
}

func GetProjectByID(projectID string) (*models.Project, error) {
	if useInMemory {
		return getProjectByIDInMemory(projectID)
	}
	return getProjectByIDMongoDB(projectID)
}

func GetUserProjects(userID string, page, limit int) ([]models.Project, int64, error) {
	if useInMemory {
		return getUserProjectsInMemory(userID, page, limit)
	}
	return getUserProjectsMongoDB(userID, page, limit)
}

func UpdateProject(project *models.Project) error {
	if useInMemory {
		return updateProjectInMemory(project)
	}
	return updateProjectMongoDB(project)
}

func DeleteProject(projectID, userID string) error {
	if useInMemory {
		return deleteProjectInMemory(projectID, userID)
	}
	return deleteProjectMongoDB(projectID, userID)
}

// Debug function to show in-memory data
func DebugInMemoryData() {
	if !useInMemory {
		return
	}

	inMemoryDB.mutex.RLock()
	defer inMemoryDB.mutex.RUnlock()

	log.Printf("📊 In-memory database status:")
	log.Printf("   Users: %d", len(inMemoryDB.users))
	log.Printf("   Sessions: %d", len(inMemoryDB.sessions))

	for id, user := range inMemoryDB.users {
		userJSON, _ := json.MarshalIndent(user, "   ", "  ")
		log.Printf("   User %s: %s", id, string(userJSON))
	}
}

// GetDatabaseStatus returns current database status
func GetDatabaseStatus() map[string]interface{} {
	if useInMemory {
		inMemoryDB.mutex.RLock()
		defer inMemoryDB.mutex.RUnlock()

		return map[string]interface{}{
			"type":           "in-memory",
			"connected":      true,
			"users_count":    len(inMemoryDB.users),
			"sessions_count": len(inMemoryDB.sessions),
			"shares_count":   len(inMemoryDB.shares),
			"persistent":     false,
		}
	}

	// Check MongoDB connection
	if Client != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		err := Client.Ping(ctx, nil)
		connected := err == nil

		return map[string]interface{}{
			"type":       "mongodb",
			"connected":  connected,
			"database":   "coderunner",
			"persistent": true,
		}
	}

	return map[string]interface{}{
		"type":      "unknown",
		"connected": false,
	}
}

// Share operations - In-memory implementations
func createShareInMemory(share *models.CodeShare) error {
	inMemoryDB.mutex.Lock()
	defer inMemoryDB.mutex.Unlock()

	if share.ID.IsZero() {
		share.ID = primitive.NewObjectID()
	}

	inMemoryDB.shares[share.ShareID] = share
	log.Printf("📝 Created share in memory: %s (%s)", share.Title, share.ShareID)
	return nil
}

func getShareByIDInMemory(shareID string) (*models.CodeShare, error) {
	inMemoryDB.mutex.RLock()
	defer inMemoryDB.mutex.RUnlock()

	share, exists := inMemoryDB.shares[shareID]
	if !exists {
		return nil, fmt.Errorf("share not found")
	}
	return share, nil
}

func getUserSharesInMemory(userID string, page, limit int) ([]models.CodeShare, int64, error) {
	inMemoryDB.mutex.RLock()
	defer inMemoryDB.mutex.RUnlock()

	var userShares []models.CodeShare
	for _, share := range inMemoryDB.shares {
		if share.AuthorID == userID {
			userShares = append(userShares, *share)
		}
	}

	total := int64(len(userShares))

	// Simple pagination
	start := (page - 1) * limit
	end := start + limit
	if start >= len(userShares) {
		return []models.CodeShare{}, total, nil
	}
	if end > len(userShares) {
		end = len(userShares)
	}

	return userShares[start:end], total, nil
}

func updateShareViewCountInMemory(shareID string) error {
	inMemoryDB.mutex.Lock()
	defer inMemoryDB.mutex.Unlock()

	share, exists := inMemoryDB.shares[shareID]
	if !exists {
		return fmt.Errorf("share not found")
	}

	share.ViewCount++
	return nil
}

// Share operations - MongoDB implementations
func createShareMongoDB(share *models.CodeShare) error {
	collection := SharesCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if share.ID.IsZero() {
		share.ID = primitive.NewObjectID()
	}

	_, err := collection.InsertOne(ctx, share)
	return err
}

func getShareByIDMongoDB(shareID string) (*models.CodeShare, error) {
	collection := SharesCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var share models.CodeShare
	err := collection.FindOne(ctx, map[string]interface{}{"share_id": shareID}).Decode(&share)
	if err != nil {
		return nil, err
	}
	return &share, nil
}

func getUserSharesMongoDB(userID string, page, limit int) ([]models.CodeShare, int64, error) {
	collection := SharesCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Count total documents
	total, err := collection.CountDocuments(ctx, map[string]interface{}{"author_id": userID})
	if err != nil {
		return nil, 0, err
	}

	// Find with pagination
	skip := int64((page - 1) * limit)
	cursor, err := collection.Find(ctx,
		map[string]interface{}{"author_id": userID},
		&options.FindOptions{
			Skip:  &skip,
			Limit: int64Ptr(int64(limit)),
			Sort:  map[string]interface{}{"created_at": -1}, // Most recent first
		},
	)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var shares []models.CodeShare
	if err := cursor.All(ctx, &shares); err != nil {
		return nil, 0, err
	}

	return shares, total, nil
}

func updateShareViewCountMongoDB(shareID string) error {
	collection := SharesCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := collection.UpdateOne(ctx,
		map[string]interface{}{"share_id": shareID},
		map[string]interface{}{"$inc": map[string]interface{}{"view_count": 1}},
	)
	return err
}

// Helper function for MongoDB options
func int64Ptr(i int64) *int64 {
	return &i
}

// Project operations - In-memory implementations
func createProjectInMemory(project *models.Project) error {
	inMemoryDB.mutex.Lock()
	defer inMemoryDB.mutex.Unlock()

	if project.ID.IsZero() {
		project.ID = primitive.NewObjectID()
	}

	inMemoryDB.projects[project.ID.Hex()] = project
	log.Printf("📁 Created project in memory: %s (%s)", project.Name, project.ID.Hex())
	return nil
}

func getProjectByIDInMemory(projectID string) (*models.Project, error) {
	inMemoryDB.mutex.RLock()
	defer inMemoryDB.mutex.RUnlock()

	project, exists := inMemoryDB.projects[projectID]
	if !exists {
		return nil, fmt.Errorf("project not found")
	}
	return project, nil
}

func getUserProjectsInMemory(userID string, page, limit int) ([]models.Project, int64, error) {
	inMemoryDB.mutex.RLock()
	defer inMemoryDB.mutex.RUnlock()

	var userProjects []models.Project
	for _, project := range inMemoryDB.projects {
		if project.OwnerID == userID {
			userProjects = append(userProjects, *project)
		}
	}

	total := int64(len(userProjects))

	// Simple pagination
	start := (page - 1) * limit
	end := start + limit
	if start >= len(userProjects) {
		return []models.Project{}, total, nil
	}
	if end > len(userProjects) {
		end = len(userProjects)
	}

	return userProjects[start:end], total, nil
}

func updateProjectInMemory(project *models.Project) error {
	inMemoryDB.mutex.Lock()
	defer inMemoryDB.mutex.Unlock()

	project.UpdatedAt = time.Now()
	inMemoryDB.projects[project.ID.Hex()] = project
	return nil
}

func deleteProjectInMemory(projectID, userID string) error {
	inMemoryDB.mutex.Lock()
	defer inMemoryDB.mutex.Unlock()

	project, exists := inMemoryDB.projects[projectID]
	if !exists {
		return fmt.Errorf("project not found")
	}

	if project.OwnerID != userID {
		return fmt.Errorf("unauthorized: not project owner")
	}

	delete(inMemoryDB.projects, projectID)
	return nil
}

// Project operations - MongoDB implementations
func createProjectMongoDB(project *models.Project) error {
	collection := ProjectsCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if project.ID.IsZero() {
		project.ID = primitive.NewObjectID()
	}

	_, err := collection.InsertOne(ctx, project)
	return err
}

func getProjectByIDMongoDB(projectID string) (*models.Project, error) {
	collection := ProjectsCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return nil, fmt.Errorf("invalid project ID: %v", err)
	}

	var project models.Project
	err = collection.FindOne(ctx, map[string]interface{}{"_id": objectID}).Decode(&project)
	if err != nil {
		return nil, err
	}
	return &project, nil
}

func getUserProjectsMongoDB(userID string, page, limit int) ([]models.Project, int64, error) {
	collection := ProjectsCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Count total documents
	total, err := collection.CountDocuments(ctx, map[string]interface{}{"owner_id": userID})
	if err != nil {
		return nil, 0, err
	}

	// Find with pagination
	skip := int64((page - 1) * limit)
	cursor, err := collection.Find(ctx,
		map[string]interface{}{"owner_id": userID},
		&options.FindOptions{
			Skip:  &skip,
			Limit: int64Ptr(int64(limit)),
			Sort:  map[string]interface{}{"last_open_at": -1}, // Most recently opened first
		},
	)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	var projects []models.Project
	if err := cursor.All(ctx, &projects); err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

func updateProjectMongoDB(project *models.Project) error {
	collection := ProjectsCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	project.UpdatedAt = time.Now()
	_, err := collection.ReplaceOne(ctx, map[string]interface{}{"_id": project.ID}, project)
	return err
}

func deleteProjectMongoDB(projectID, userID string) error {
	collection := ProjectsCollection()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	objectID, err := primitive.ObjectIDFromHex(projectID)
	if err != nil {
		return fmt.Errorf("invalid project ID: %v", err)
	}

	// Delete only if user owns the project
	result, err := collection.DeleteOne(ctx, map[string]interface{}{
		"_id":      objectID,
		"owner_id": userID,
	})
	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("project not found or unauthorized")
	}

	return nil
}

// Project Share functions
func CreateProjectShare(projectShare *models.ProjectShare) error {
	if useInMemory {
		inMemoryDB.mutex.Lock()
		defer inMemoryDB.mutex.Unlock()

		// Store by ShareID for easy retrieval
		inMemoryDB.shares[projectShare.ShareID] = &models.CodeShare{
			ID:          projectShare.ID,
			ShareID:     projectShare.ShareID,
			Title:       projectShare.Title,
			Code:        "", // Will be handled differently for projects
			Language:    projectShare.Language,
			Description: projectShare.Description,
			AuthorID:    projectShare.AuthorID,
			AuthorName:  projectShare.AuthorName,
			AuthorEmail: projectShare.AuthorEmail,
			IsPublic:    projectShare.IsPublic,
			ViewCount:   projectShare.ViewCount,
			CreatedAt:   projectShare.CreatedAt,
			UpdatedAt:   projectShare.UpdatedAt,
			Tags:        projectShare.Tags,
			Category:    projectShare.Category,
		}

		// Store the full project share separately
		// For now, we'll store it as JSON in a separate map
		// In a real implementation, you'd have a separate collection
		return nil
	}

	// MongoDB implementation
	collection := Client.Database("coderunner").Collection("project_shares")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err := collection.InsertOne(ctx, projectShare)
	return err
}

func GetProjectShareByID(shareID string) (*models.ProjectShare, error) {
	if useInMemory {
		inMemoryDB.mutex.RLock()
		defer inMemoryDB.mutex.RUnlock()

		// For in-memory, we'll need to implement this properly
		// For now, return nil to indicate not found
		return nil, fmt.Errorf("project share not found")
	}

	// MongoDB implementation
	collection := Client.Database("coderunner").Collection("project_shares")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var projectShare models.ProjectShare
	err := collection.FindOne(ctx, map[string]interface{}{"share_id": shareID}).Decode(&projectShare)
	if err != nil {
		return nil, err
	}

	// Increment view count
	collection.UpdateOne(ctx,
		map[string]interface{}{"share_id": shareID},
		map[string]interface{}{"$inc": map[string]interface{}{"view_count": 1}},
	)

	return &projectShare, nil
}
