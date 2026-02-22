import os
import io
import tempfile
from typing import Optional

import requests
from PIL import Image
import gradio as gr
import fal_client


# ================================
# Configuration / API Key
# ================================
# RECOMMENDED: set an environment variable before running this app.
# In PowerShell (Windows):
#   $env:FAL_KEY = "YOUR_FAL_API_KEY_HERE"
#
# In bash (macOS/Linux):
#   export FAL_KEY="YOUR_FAL_API_KEY_HERE"
#
# The code below reads the key from the environment.
# If it's missing, the app will show a friendly error in the UI.
FAL_API_KEY: Optional[str] = os.getenv("FAL_KEY")


def run_virtual_tryon(human_image: Image.Image, garment_image: Image.Image) -> Image.Image:
    """
    Call the fal-ai/fashn/tryon model via fal_client with the uploaded images.

    - human_image: PIL Image from the user (their photo)
    - garment_image: PIL Image of the garment (flat-lay)

    Returns a PIL Image with the try-on result, or raises gr.Error on failure.
    """

    if human_image is None or garment_image is None:
        raise gr.Error("Please upload BOTH a human photo and a garment photo before generating.")

    if not FAL_API_KEY:
        raise gr.Error(
            "Missing FAL API key.\n\n"
            "Set it in your terminal before running this app, for example:\n"
            '  PowerShell:  $env:FAL_KEY = "YOUR_FAL_API_KEY_HERE"\n'
            '  bash:        export FAL_KEY="YOUR_FAL_API_KEY_HERE"\n\n'
            "Then restart the app."
        )

    # Configure fal_client with the API key
    fal_client.api_key = FAL_API_KEY

    human_tmp_path = None
    garment_tmp_path = None

    try:
        # Save PIL images to temporary PNG files (local temp storage)
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f1:
            human_image.save(f1, format="PNG")
            human_tmp_path = f1.name

        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f2:
            garment_image.save(f2, format="PNG")
            garment_tmp_path = f2.name

        # Upload images to fal.ai and get file URLs
        human_file = fal_client.upload_file(path=human_tmp_path)
        garment_file = fal_client.upload_file(path=garment_tmp_path)

        human_url = human_file.get("url")
        garment_url = garment_file.get("url")

        if not human_url or not garment_url:
            raise gr.Error("Failed to upload images to the FASHN service. Please try again.")

        # Call the fal-ai/fashn/tryon model endpoint
        # Parameters per spec:
        #   - category = "tops"
        #   - garment_photo_type = "flat-lay"
        #   - high-res output (model defaults >= 768x1024, e.g. ~864x1296)
        handler = fal_client.submit(
            "fal-ai/fashn/tryon",
            arguments={
                "model_image": human_url,
                "garment_image": garment_url,
                "category": "tops",
                "garment_photo_type": "flat-lay",
                "mode": "balanced",  # good quality/speed tradeoff for MVP
            },
        )

        # Wait for the result
        result = handler.get()

        # Extract image URL robustly from response
        output_url = None
        if isinstance(result, dict):
            if "image" in result and isinstance(result["image"], dict):
                output_url = result["image"].get("url")

            if not output_url and "images" in result and result["images"]:
                first = result["images"][0]
                if isinstance(first, dict):
                    output_url = first.get("url")
                    if not output_url and isinstance(first.get("image"), dict):
                        output_url = first["image"].get("url")

        if not output_url:
            raise gr.Error("The FASHN API response did not contain an output image URL.")

        # Download the generated image
        resp = requests.get(output_url, timeout=60)
        resp.raise_for_status()

        output_image = Image.open(io.BytesIO(resp.content)).convert("RGB")
        return output_image

    except gr.Error:
        # Let Gradio errors surface directly
        raise
    except Exception as e:
        # Catch-all for network, API, or format issues
        raise gr.Error(f"Virtual try-on failed: {e}")
    finally:
        # Clean up temp files
        for path in (human_tmp_path, garment_tmp_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass


def create_app() -> gr.Blocks:
    """
    Build and return the Gradio Blocks app for the FutureFit MVP.
    """
    with gr.Blocks(title="FutureFit - Virtual Try-On") as demo:
        gr.Markdown(
            """
            ### FutureFit – Virtual Try-On (MVP)

            Upload a clear photo of yourself and a flat-lay garment image.  
            Click **Generate Look** to see how the garment might look on you (AI approximation).
            """
        )

        with gr.Row():
            with gr.Column():
                human_input = gr.Image(
                    label="Human Image (Your Photo)",
                    type="pil",
                    image_mode="RGB",
                )
                gr.Markdown(
                    "Upload a front-facing photo with good lighting. "
                    "For best results, avoid heavy occlusions (e.g., hands in front of torso)."
                )

            with gr.Column():
                garment_input = gr.Image(
                    label="Garment Image (Flat-Lay)",
                    type="pil",
                    image_mode="RGB",
                )
                gr.Markdown(
                    "Upload a **flat-lay** garment photo (tops only for this MVP). "
                    "Make sure the garment is clearly visible against a simple background."
                )

        generate_btn = gr.Button("Generate Look 🚀", variant="primary")

        output_image = gr.Image(
            label="AI Try-On Result",
            type="pil",
            visible=True,
        )

        # Mock "Buy Now" section under the result
        gr.Markdown(
            """
            ### Shop This Look

            **FutureFit Essentials Top** – _AI-styled preview_  
            **Price:** **$49.99**

            > _This is a demo “Buy Now” section for the hackathon MVP.  
            > In a real app, this would link to your commerce or product detail page._

            **[🛒 Buy Now (Mock)](#)**
            """
        )

        # Wire logic to UI
        generate_btn.click(
            fn=run_virtual_tryon,
            inputs=[human_input, garment_input],
            outputs=[output_image],
        )

        return demo


if __name__ == "__main__":
    app = create_app()
    # For hackathon/demo you can enable share=True if you want a public link.
    # app.launch(share=True)
    app.launch()


