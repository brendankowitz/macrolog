import * as FileSystem from 'expo-file-system';

/**
 * Convert an image file to base64 string
 * @param imageUri - Local file URI of the image
 * @returns Base64 encoded string (without data:image prefix)
 */
export async function convertImageToBase64(imageUri: string): Promise<string> {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Save image to app's document directory organized by date
 * @param imageUri - Source image URI
 * @param mealId - Unique meal ID for the filename
 * @returns New file URI in document directory
 */
export async function saveImageToDocuments(
  imageUri: string,
  mealId: string
): Promise<string> {
  try {
    const date = new Date();
    const dateFolder = date.toISOString().split('T')[0]; // YYYY-MM-DD

    const directory = `${FileSystem.documentDirectory}meals/${dateFolder}/`;

    // Create directory if it doesn't exist
    const dirInfo = await FileSystem.getInfoAsync(directory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }

    // Create unique filename
    const filename = `${mealId}.jpg`;
    const newUri = `${directory}${filename}`;

    // Copy image to new location
    await FileSystem.copyAsync({
      from: imageUri,
      to: newUri,
    });

    return newUri;
  } catch (error) {
    console.error('Error saving image:', error);
    throw new Error('Failed to save image');
  }
}

/**
 * Delete a saved meal image
 * @param imageUri - URI of the image to delete
 */
export async function deleteImage(imageUri: string): Promise<void> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(imageUri);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - it's okay if deletion fails
  }
}
