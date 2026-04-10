package database

import (
	"context"
	"crypto/tls"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	Client   *mongo.Client
	Database *mongo.Database
)

// ConnectMongoDB initializes the MongoDB connection
func ConnectMongoDB() error {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		log.Fatal("MONGODB_URI environment variable is not set")
	}

	// Set client options
	clientOptions := options.Client().ApplyURI(mongoURI)
	clientOptions.SetMaxPoolSize(10)
	clientOptions.SetMinPoolSize(5)
	clientOptions.SetMaxConnIdleTime(30 * time.Second)
	clientOptions.SetConnectTimeout(15 * time.Second)
	clientOptions.SetServerSelectionTimeout(15 * time.Second)

	// Configure TLS for Windows compatibility - try with TLS disabled for testing
	tlsConfig := &tls.Config{
		InsecureSkipVerify: true, // For testing only
	}
	clientOptions.SetTLSConfig(tlsConfig)

	// Alternative: try without TLS for testing
	// clientOptions.SetTLSConfig(nil)

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		return err
	}

	// Test the connection
	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	Client = client
	Database = client.Database("coderunner")

	log.Println("✅ Connected to MongoDB Atlas")
	return nil
}

// DisconnectMongoDB closes the MongoDB connection
func DisconnectMongoDB() error {
	if Client == nil {
		return nil
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	err := Client.Disconnect(ctx)
	if err != nil {
		return err
	}

	log.Println("🔌 Disconnected from MongoDB")
	return nil
}

// GetCollection returns a MongoDB collection
func GetCollection(name string) *mongo.Collection {
	return Database.Collection(name)
}

// Collections
func UsersCollection() *mongo.Collection {
	return GetCollection("users")
}

func SessionsCollection() *mongo.Collection {
	return GetCollection("sessions")
}

func ExecutionsCollection() *mongo.Collection {
	return GetCollection("executions")
}

func SharesCollection() *mongo.Collection {
	return GetCollection("shares")
}

func ProjectsCollection() *mongo.Collection {
	return GetCollection("projects")
}
