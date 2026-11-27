from django.db import migrations, models


def rename_wishlist_status(apps, schema_editor):
    LibraryEntry = apps.get_model("Backend", "LibraryEntry")
    LibraryEntry.objects.filter(status="WISHLIST").update(status="WANT_TO_READ")


def restore_wishlist_status(apps, schema_editor):
    LibraryEntry = apps.get_model("Backend", "LibraryEntry")
    LibraryEntry.objects.filter(status="WANT_TO_READ").update(status="WISHLIST")


class Migration(migrations.Migration):
    dependencies = [
        ("Backend", "0001_initial"),
    ]

    operations = [
        # AlterField precisa vir antes do RunPython: no PostgreSQL a coluna ainda
        # é varchar(8) e não comporta "WANT_TO_READ" (13 caracteres).
        migrations.AlterField(
            model_name="libraryentry",
            name="status",
            field=models.CharField(
                choices=[
                    ("WANT_TO_READ", "Quero ler"),
                    ("READING", "Lendo"),
                    ("READ", "Lido"),
                ],
                max_length=12,
                verbose_name="status",
            ),
        ),
        migrations.RunPython(rename_wishlist_status, restore_wishlist_status),
    ]
