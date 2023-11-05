from PIL import Image
import os

# Path to the directory containing the images
input_directory = './Public/Images/dish_images/change'

# Path to the directory where you want to save the resized images
output_directory = './Public/Images/dish_images'

# Desired width for the resized images
target_width = 2660
target_height = 1920

# Iterate over all the files in the input directory
for filename in os.listdir(input_directory):
    if filename.endswith(".jpg") or filename.endswith(".png") or filename.endswith(".jpeg"):
        input_path = os.path.join(input_directory, filename)
        output_path = os.path.join(output_directory, filename)

        # Open the image file
        image = Image.open(input_path)

        # Resize the image
        resized_image = image.resize(
            (target_width, target_height), Image.LANCZOS)

        # Save the resized image
        resized_image.save(output_path)

        print(f"Resized {filename} to {target_width}x{target_height}")

print("All images resized successfully.")
