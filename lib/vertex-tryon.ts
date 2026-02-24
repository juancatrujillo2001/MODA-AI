/**
 * Google Vertex AI Virtual Try-On Integration
 *
 * Model: virtual-try-on-001
 * Docs: https://cloud.google.com/vertex-ai/generative-ai/docs/image/virtual-try-on
 *
 * Setup:
 * 1. Create a Google Cloud project: https://console.cloud.google.com
 * 2. Enable the Vertex AI API
 * 3. Create a service account with "Vertex AI User" role
 * 4. Download the JSON key file
 * 5. Set GOOGLE_APPLICATION_CREDENTIALS to the path of the JSON file
 * 6. Set GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_REGION in .env
 *
 * New Google Cloud accounts get $300 free credits.
 * Pricing: ~$0.02-$0.04 per generated image.
 */

const PLACEHOLDER_TRYON_IMAGE =
  "data:image/svg+xml;base64," +
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="533" viewBox="0 0 400 533">
      <rect width="400" height="533" fill="#f3f4f6"/>
      <rect x="50" y="30" width="300" height="470" rx="20" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
      <circle cx="200" cy="120" r="45" fill="#d1d5db"/>
      <path d="M130 200 Q200 170 270 200 L280 420 Q200 440 120 420 Z" fill="#d1d5db"/>
      <rect x="140" y="250" width="120" height="140" rx="8" fill="#c4b5fd" opacity="0.6"/>
      <rect x="150" y="390" width="40" height="60" rx="4" fill="#c4b5fd" opacity="0.4"/>
      <rect x="210" y="390" width="40" height="60" rx="4" fill="#c4b5fd" opacity="0.4"/>
      <text x="200" y="500" text-anchor="middle" font-family="system-ui" font-size="13" fill="#9ca3af">Virtual Try-On Preview</text>
      <text x="200" y="520" text-anchor="middle" font-family="system-ui" font-size="10" fill="#d1d5db">Configure Google Cloud credentials to enable</text>
    </svg>`
  ).toString("base64");

interface TryOnResult {
  image: string; // base64 data URI or placeholder
  isPlaceholder: boolean;
}

/**
 * Fetches an image from a URL and returns its base64 representation.
 */
async function imageUrlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString("base64");
}

/**
 * Checks if Google Cloud credentials are configured.
 */
export function isVertexConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLOUD_PROJECT_ID &&
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  );
}

/**
 * Generates a virtual try-on image using Vertex AI virtual-try-on-001 model.
 *
 * Sends the user's photo and a garment image to the model, which returns
 * a composite image of the person wearing the garment.
 */
export async function generateTryOn(
  personImageUrl: string,
  garmentImageUrl: string
): Promise<TryOnResult> {
  if (!isVertexConfigured()) {
    return { image: PLACEHOLDER_TRYON_IMAGE, isPlaceholder: true };
  }

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    const region = process.env.GOOGLE_CLOUD_REGION || "us-central1";

    // Import Google Auth to get access token
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    const accessToken = accessTokenResponse.token;

    // Convert images to base64
    const [personBase64, garmentBase64] = await Promise.all([
      imageUrlToBase64(personImageUrl),
      imageUrlToBase64(garmentImageUrl),
    ]);

    const endpoint = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/virtual-try-on-001:predict`;

    const requestBody = {
      instances: [
        {
          personImage: {
            bytesBase64Encoded: personBase64,
          },
          garmentImage: {
            bytesBase64Encoded: garmentBase64,
          },
        },
      ],
      parameters: {
        sampleCount: 1,
      },
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Vertex AI try-on error:", errorText);
      return { image: PLACEHOLDER_TRYON_IMAGE, isPlaceholder: true };
    }

    const data = await response.json();
    const generatedImage = data.predictions?.[0]?.bytesBase64Encoded;

    if (!generatedImage) {
      console.error("Vertex AI: no image in response");
      return { image: PLACEHOLDER_TRYON_IMAGE, isPlaceholder: true };
    }

    // Return as a data URI
    const dataUri = `data:image/png;base64,${generatedImage}`;
    return { image: dataUri, isPlaceholder: false };
  } catch (error) {
    console.error("Virtual try-on generation failed:", error);
    return { image: PLACEHOLDER_TRYON_IMAGE, isPlaceholder: true };
  }
}
