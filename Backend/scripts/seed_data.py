import os
import sys
import django
import uuid
import random
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path

# Add project root to Python path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

# === IMPORT MODELS ===

from users.models import User, UserType, UserState
from contacts.models import Contact, ContactState, Message as ContactMessage
from products.models import Brand, Category, Product, ProductSpec, ProductRelation
from accessories.models import Accessory, ProductAccessory
from attachments.models import Attachment
from notes.models import Note, NoteType, NoteState
from quotes.models import QuoteType, QuoteState, Quote, QuoteItem


# ============================================================
# HELPERS
# ============================================================

def create_if_not_exists(model, lookup: dict, defaults: dict = None):
    """Utility to avoid duplication and simplify creation."""
    obj, created = model.objects.get_or_create(**lookup, defaults=defaults or {})
    return obj, created


# ============================================================
# USER DATA
# ============================================================

def seed_user_types():
    print("Seeding UserType...")
    types = ["ADMIN", "BACKOFFICE"]

    objs = []
    for t in types:
        obj, _ = create_if_not_exists(
            UserType,
            {"id": t},
            {"name": t, "description": f"User type {t}"}
        )
        objs.append(obj)

    return objs


def seed_user_states():
    print("Seeding UserState...")
    states = ["ACTIVE", "INACTIVE", "SUSPENDED"]

    objs = []
    for s in states:
        obj, _ = create_if_not_exists(
            UserState,
            {"id": s},
            {"name": s, "description": f"User state {s}"}
        )
        objs.append(obj)

    return objs


def seed_users():
    print("Seeding Users...")

    admin_type = UserType.objects.get(id="ADMIN")
    backoffice_type = UserType.objects.get(id="BACKOFFICE")

    active_state = UserState.objects.get(id="ACTIVE")

    users = [
        ("admin", "admin123", admin_type),
        ("backoffice", "123456", backoffice_type),
    ]

    for username, password, user_type in users:
        if not User.objects.filter(username=username).exists():
            User.objects.create_user(
                id=uuid.uuid4(),
                username=username,
                email=f"{username}@example.com",
                password=password,
                user_type=user_type,
                state=active_state,
            )
            print(f"✔ Created user {username}")
        else:
            print(f"↳ User {username} already exists")


# ============================================================
# CONTACT DATA
# ============================================================

def seed_contact_states():
    print("Seeding ContactState...")

    states = ["NEW", "IN_PROGRESS", "RESPONDED", "CLOSED"]

    objs = []
    for s in states:
        obj, _ = create_if_not_exists(
            ContactState,
            {"id": s},
            {"name": s, "color": "#000000"}
        )
        objs.append(obj)

    return objs


def seed_contacts():
    print("Seeding Contacts...")

    state = ContactState.objects.get(id="NEW")
    assigned = User.objects.filter(user_type__id="BACKOFFICE").first()

    for i in range(3):
        Contact.objects.get_or_create(
            email=f"cliente{i}@mail.com",
            defaults={
                "id": uuid.uuid4(),
                "company_name": f"Empresa {i}",
                "first_name": f"Juan{i}",
                "last_name": f"Pérez{i}",
                "state": state,
                "assigned_user": assigned,
            }
        )

    print("✔ Contacts created")


# ============================================================
# PRODUCT DATA
# ============================================================

def seed_brands():
    print("Seeding Brands...")

    brands = ["WHEATON", "Eppendorf", "2mag", "Thermo Fisher", "Corning"]

    objs = []
    for name in brands:
        obj, _ = create_if_not_exists(
            Brand,
            {"name": name},
            {"description": f"Brand {name}"}
        )
        objs.append(obj)

    return objs


def seed_categories():
    print("Seeding Categories...")

    categories = []

    # Categorías de nivel 0 (raíz) - obligatorias para carga masiva
    for name in ["Insumos", "Procesos", "Equipos", "Mobiliario"]:
        cat, _ = Category.objects.get_or_create(
            name=name,
            parent=None,
            defaults={"id": uuid.uuid4(), "level": 0}
        )
        categories.append(cat)

    return categories


def seed_products(brands, categories):
    print("Seeding Products...")

    product_names = ["Frascos para cultivo celular Celstir", "Micropipetas de Volumen Variable", "Vaso medidor"]

    productos = []

    for name in product_names:
        obj, created = Product.objects.get_or_create(
            name=name,
            brand=random.choice(brands),
            category=random.choice(categories),
            defaults={
                "id": uuid.uuid4(),
                "description": f"Descripción de {name}",
                "is_active": True,
            }
        )
        productos.append(obj)

    print("✔ Products created")

    return productos


def seed_product_specs(products):
    print("Seeding ProductSpecs...")

    for p in products:
        ProductSpec.objects.get_or_create(
            product=p,
            code="STD",
            defaults={
                "id": uuid.uuid4(),
                "volume": "500ml",
                "dimensions": "10x10cm",
            }
        )


def seed_product_relations(products):
    print("Seeding ProductRelations...")

    if len(products) >= 2:
        ProductRelation.objects.get_or_create(
            from_product=products[0],
            to_product=products[1],
            defaults={"id": uuid.uuid4()}
        )


# ============================================================
# ACCESSORIES
# ============================================================

def seed_accessories(products):
    print("Seeding Accessories...")

    acc = Accessory.objects.get_or_create(
        code="ACC-001",
        defaults={
            "id": uuid.uuid4(),
            "brand": "Generic",
            "model": "Model X",
            "price": Decimal("1500.00"),
        }
    )[0]

    # relate to first product
    ProductAccessory.objects.get_or_create(
        product=products[0],
        accessory=acc
    )


# ============================================================
# QUOTES
# ============================================================

def seed_quote_types():
    print("Seeding QuoteType...")

    types = ["EQUIPMENT", "SUPPLIES", "PROCESSED", "FURNITURE"]

    objs = []
    for t in types:
        obj, _ = create_if_not_exists(
            QuoteType,
            {"id": t},
            {"name": t}
        )
        objs.append(obj)

    return objs


def seed_quote_states():
    print("Seeding QuoteState...")

    states = ["PENDING", "REJECTED", "SENT", "CONFIRMED", "EXPIRED" ]

    objs = []
    for s in states:
        obj, _ = create_if_not_exists(
            QuoteState,
            {"id": s},
            {"name": s, "color": "#123456"}
        )
        objs.append(obj)

    return objs


def seed_quotes(products):
    print("Seeding Quotes...")

    contact = Contact.objects.first()
    user = User.objects.first()
    qtype = QuoteType.objects.first()
    qstate = QuoteState.objects.first()

    q, created = Quote.objects.get_or_create(
        quote_number="Q-SEED01",
        defaults={
            "id": uuid.uuid4(),
            "contact": contact,
            "user": user,
            "quote_type": qtype,
            "state": qstate,
            "total_amount": Decimal("5000.00"),
        }
    )

    if created:
        QuoteItem.objects.create(
            id=uuid.uuid4(),
            quote=q,
            product=products[0],
            quantity=2,
            unit_price=Decimal("2500.00"),
            subtotal=Decimal("5000.00"),
        )


# ============================================================
# NOTES
# ============================================================

def seed_note_types():
    print("Seeding NoteType...")

    types = ["PRODUCT", "COMPANY", "EVENT", "PROMOTION", "TRAINING"]

    for t in types:
        create_if_not_exists(
            NoteType,
            {"id": t},
            {"name": t}
        )


def seed_note_states():
    print("Seeding NoteState...")

    states = ["DRAFT", "PUBLISHED", "ARCHIVED"]

    for s in states:
        create_if_not_exists(
            NoteState,
            {"id": s},
            {"name": s}
        )


def seed_notes():
    print("Seeding Notes...")

    user = User.objects.first()
    ntype = NoteType.objects.first()
    nstate = NoteState.objects.first()

    Note.objects.get_or_create(
        title="Nota de ejemplo",
        author=user,
        defaults={
            "id": uuid.uuid4(),
            "summary": "Resumen",
            "content": "Contenido de prueba",
            "note_type": ntype,
            "state": nstate,
        }
    )


# ============================================================
# ATTACHMENTS (opcionales)
# ============================================================

def seed_attachments():
    """
    Seed de attachments usando FileField.
    Los attachments reales se crearán cuando los usuarios suban archivos.
    Esta función está deshabilitada porque no es necesario crear attachments dummy.
    """
    print("Seeding Attachments... (skipped - attachments are created dynamically)")
    pass


# ============================================================
# MAIN RUN
# ============================================================

def run():
    print("\n======= SEEDING DEVELOPMENT DATA =======\n")

    seed_user_types()
    seed_user_states()
    seed_users()

    seed_contact_states()
    seed_contacts()

    brands = seed_brands()
    categories = seed_categories()
    products = seed_products(brands, categories)
    seed_product_specs(products)
    seed_product_relations(products)

    seed_accessories(products)

    seed_quote_types()
    seed_quote_states()
    seed_quotes(products)

    seed_note_types()
    seed_note_states()
    seed_notes()

    seed_attachments()

    print("\n======= DONE SEEDING DATA =======\n")


if __name__ == "__main__":
    run()
